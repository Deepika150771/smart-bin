export const esp32ArduinoCode = `/*
 * SmartBin - ESP32 IoT Garbage Monitoring System Firmware
 * Hardware Components:
 *   1. ESP32 Dev Module
 *   2. Ultrasonic Sensor HC-SR04 / JSN-SR04T (Trig & Echo)
 *   3. SSD1306 OLED Display 128x64 (I2C)
 *   4. SG90 Servo Motor (Automatic Lid Control)
 *
 * Pin Mapping:
 *   - HC-SR04 TRIG  : GPIO 5
 *   - HC-SR04 ECHO  : GPIO 18
 *   - SG90 SERVO PWM: GPIO 13
 *   - OLED SDA      : GPIO 21
 *   - OLED SCL      : GPIO 22
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>

// WiFi Configuration
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API Configuration
const char* serverUrl = "http://192.168.1.100:5000/api/telemetry"; // Replace with your laptop IP
const char* BIN_ID    = "BIN-101";

// Hardware Pin Definitions
#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 13

// Bin Dimensions
const float TOTAL_BIN_HEIGHT_CM = 100.0; // Distance from top sensor to bin bottom
const float HAND_DETECT_DIST_CM  = 15.0;  // Open lid if object detected closer than 15 cm

// OLED Display Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Servo Motor Instance
Servo lidServo;

// Global state variables
float currentDistanceCm = 0.0;
int fillPercentage      = 0;
String binStatus        = "EMPTY";
bool lidOpen            = false;
unsigned long lastApiPostTime = 0;
const unsigned long API_POST_INTERVAL = 5000; // Post telemetry every 5s

// Function Declarations
float measureDistance();
int calculateFillPercentage(float distanceCm);
String determineStatus(int percentage);
void updateOLEDDisplay(int pct, String status, float distCm, bool lidOpened);
void controlLidServo(float distanceCm);
void sendTelemetryToBackend(float distCm, int pct, String status, bool servoUsed);

void setup() {
  Serial.begin(115200);
  Serial.println("\\n--- Initializing SmartBin ESP32 Node ---");

  // Pin Modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Servo Setup
  ESP32PWM::allocateTimer(0);
  lidServo.setPeriodHertz(50); // Standard 50Hz servo
  lidServo.attach(SERVO_PIN, 500, 2400);
  lidServo.write(0); // Ensure lid is closed at start (0 degrees)

  // Initialize OLED Display (0x3C address)
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed. Check I2C wiring."));
    for (;;); // Stop execution if display fails
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 10);
  display.println("SmartBin System v1.0");
  display.println("Connecting WiFi...");
  display.display();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\\nWiFi Connection Timeout. Running standalone mode.");
  }
}

void loop() {
  // 1. Read Ultrasonic Sensor Distance
  currentDistanceCm = measureDistance();

  // 2. Calculate Fill Level % & Status
  fillPercentage = calculateFillPercentage(currentDistanceCm);
  binStatus      = determineStatus(fillPercentage);

  // 3. Automatic Servo Lid Opening Logic
  bool servoActivatedThisCycle = false;
  if (currentDistanceCm > 0 && currentDistanceCm <= HAND_DETECT_DIST_CM && !lidOpen) {
    Serial.println("[SERVO] Motion/Hand Detected! Opening Bin Lid...");
    lidServo.write(90); // Open 90 degrees
    lidOpen = true;
    servoActivatedThisCycle = true;
    
    // Display opening message on OLED
    updateOLEDDisplay(fillPercentage, binStatus, currentDistanceCm, true);
    delay(3000); // Keep open for 3 seconds
    
    Serial.println("[SERVO] Closing Bin Lid.");
    lidServo.write(0);  // Return to closed position
    lidOpen = false;
  }

  // 4. Update OLED Display with Fill % & Status Bar
  updateOLEDDisplay(fillPercentage, binStatus, currentDistanceCm, lidOpen);

  // 5. Send HTTP POST Telemetry to Node.js Backend API
  if (millis() - lastApiPostTime >= API_POST_INTERVAL) {
    sendTelemetryToBackend(currentDistanceCm, fillPercentage, binStatus, servoActivatedThisCycle);
    lastApiPostTime = millis();
  }

  delay(500); // Sampling rate loop delay
}

// Measure distance in CM using HC-SR04 sensor pulse
float measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return TOTAL_BIN_HEIGHT_CM; // Default full distance if out of range

  float distanceCm = (duration * 0.0343) / 2.0;
  return Math.min((float)TOTAL_BIN_HEIGHT_CM, Math.max(0.0f, distanceCm));
}

// Convert ultrasonic distance to garbage fill percentage (0-100%)
int calculateFillPercentage(float distanceCm) {
  float filledHeight = TOTAL_BIN_HEIGHT_CM - distanceCm;
  float pct = (filledHeight / TOTAL_BIN_HEIGHT_CM) * 100.0;
  return (int)constrain(pct, 0, 100);
}

// Determine status label from fill percentage
String determineStatus(int percentage) {
  if (percentage >= 80) return "FULL!";
  if (percentage >= 40) return "HALF";
  return "EMPTY";
}

// Draw percentage, progress bar, and status on SSD1306 OLED
void updateOLEDDisplay(int pct, String status, float distCm, bool lidOpened) {
  display.clearDisplay();

  // Header Title
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("BIN: ");
  display.print(BIN_ID);

  if (lidOpened) {
    display.setCursor(70, 0);
    display.print("[LID OPEN]");
  }

  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  // Large Fill Percentage Display
  display.setTextSize(2);
  display.setCursor(0, 16);
  display.print(pct);
  display.print("%");

  // Status Text
  display.setTextSize(1);
  display.setCursor(70, 20);
  display.print("STATUS:");
  display.setCursor(70, 30);
  display.print(status);

  // Draw Progress Bar (X=0, Y=44, W=128, H=14)
  display.drawRect(0, 44, 128, 14, SSD1306_WHITE);
  int barWidth = map(pct, 0, 100, 0, 124);
  display.fillRect(2, 46, barWidth, 10, SSD1306_WHITE);

  display.display();
}

// Send HTTP POST payload to Express Backend Telemetry endpoint
void sendTelemetryToBackend(float distCm, int pct, String status, bool servoUsed) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Format JSON payload
  String jsonPayload = "{";
  jsonPayload += "\\"binId\\":\\"" + String(BIN_ID) + "\\",";
  jsonPayload += "\\"distanceCm\\":" + String(distCm, 1) + ",";
  jsonPayload += "\\"fillPercentage\\":" + String(pct) + ",";
  jsonPayload += "\\"servoActivated\\":" + String(servoUsed ? "true" : "false");
  jsonPayload += "}";

  int httpResponseCode = http.POST(jsonPayload);
  if (httpResponseCode > 0) {
    Serial.printf("[HTTP] POST Success. Code: %d\\n", httpResponseCode);
  } else {
    Serial.printf("[HTTP] POST Failed. Error: %s\\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
`;
