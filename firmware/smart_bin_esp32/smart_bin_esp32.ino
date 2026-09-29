/*
 * SmartBin - Full-stack IoT Smart Garbage Monitoring System Firmware
 * Hardware Components:
 *   1. ESP32 Microcontroller
 *   2. HC-SR04 Ultrasonic Distance Sensor
 *   3. SSD1306 OLED Display (128x64 I2C)
 *   4. SG90 Servo Motor (Automatic Lid Opening)
 *
 * Pin Mapping Table:
 *   +-------------------+----------------+
 *   | Component         | ESP32 GPIO Pin |
 *   +-------------------+----------------+
 *   | HC-SR04 TRIG      | GPIO 5         |
 *   | HC-SR04 ECHO      | GPIO 18        |
 *   | SG90 Servo PWM    | GPIO 13        |
 *   | OLED I2C SDA      | GPIO 21        |
 *   | OLED I2C SCL      | GPIO 22        |
 *   +-------------------+----------------+
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>

// WiFi credentials
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API URL
const char* serverUrl = "http://192.168.1.100:5000/api/telemetry"; // Change to your server IP
const char* BIN_ID    = "BIN-101";

// Hardware Pins
#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 13

// Bin dimensions in CM
const float TOTAL_BIN_HEIGHT_CM = 100.0; // Distance from top sensor to bin bottom
const float HAND_DETECT_DIST_CM  = 15.0;  // Trigger lid open when object closer than 15 cm

// OLED Config
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Servo
Servo lidServo;

// Internal variables
float currentDistanceCm = 0.0;
int fillPercentage      = 0;
String binStatus        = "EMPTY";
bool lidOpen            = false;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 5000;

// Function prototypes
float readUltrasonicDistance();
int calculateFillPercentage(float distanceCm);
String getStatusLabel(int percentage);
void renderOLED(int pct, String status, float distCm, bool lidOpened);
void handleAutoLid(float distanceCm);
void sendHttpTelemetry(float distCm, int pct, String status, bool servoUsed);

void setup() {
  Serial.begin(115200);
  Serial.println("\n=============================================");
  Serial.println("   SmartBin ESP32 IoT Node Initializing      ");
  Serial.println("=============================================");

  // Pins Setup
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Servo Setup
  ESP32PWM::allocateTimer(0);
  lidServo.setPeriodHertz(50);
  lidServo.attach(SERVO_PIN, 500, 2400);
  lidServo.write(0); // Closed lid (0 degrees)

  // OLED Setup
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED Allocation Failed!");
    for (;;);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 10);
  display.println("SmartBin ESP32 v1.0");
  display.println("Connecting to WiFi...");
  display.display();

  // WiFi Connection
  WiFi.begin(ssid, password);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection timeout. Operating offline mode.");
  }
}

void loop() {
  // 1. Measure Distance via Ultrasonic Sensor
  currentDistanceCm = readUltrasonicDistance();

  // 2. Compute Fill Percentage & Status
  fillPercentage = calculateFillPercentage(currentDistanceCm);
  binStatus      = getStatusLabel(fillPercentage);

  // 3. Auto Lid Opening Logic
  bool servoActivated = false;
  if (currentDistanceCm > 0 && currentDistanceCm <= HAND_DETECT_DIST_CM && !lidOpen) {
    Serial.println("[Servo] Proximity triggered! Opening Lid...");
    lidServo.write(90); // Open lid to 90 degrees
    lidOpen = true;
    servoActivated = true;

    renderOLED(fillPercentage, binStatus, currentDistanceCm, true);
    delay(3000); // Keep open for 3 seconds

    Serial.println("[Servo] Closing Lid.");
    lidServo.write(0);  // Close lid
    lidOpen = false;
  }

  // 4. Update OLED Display
  renderOLED(fillPercentage, binStatus, currentDistanceCm, lidOpen);

  // 5. Send HTTP Telemetry to Express Server
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    sendHttpTelemetry(currentDistanceCm, fillPercentage, binStatus, servoActivated);
    lastTelemetryTime = millis();
  }

  delay(400);
}

float readUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return TOTAL_BIN_HEIGHT_CM;

  float distanceCm = (duration * 0.0343) / 2.0;
  return constrain(distanceCm, 0.0f, TOTAL_BIN_HEIGHT_CM);
}

int calculateFillPercentage(float distanceCm) {
  float filledHeight = TOTAL_BIN_HEIGHT_CM - distanceCm;
  float pct = (filledHeight / TOTAL_BIN_HEIGHT_CM) * 100.0;
  return (int)constrain(pct, 0, 100);
}

String getStatusLabel(int percentage) {
  if (percentage >= 80) return "FULL!";
  if (percentage >= 40) return "HALF";
  return "EMPTY";
}

void renderOLED(int pct, String status, float distCm, bool lidOpened) {
  display.clearDisplay();

  // Header Title
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("BIN: ");
  display.print(BIN_ID);

  if (lidOpened) {
    display.setCursor(68, 0);
    display.print("[OPEN]");
  }

  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  // Fill Percentage
  display.setTextSize(2);
  display.setCursor(0, 16);
  display.print(pct);
  display.print("%");

  // Status Label
  display.setTextSize(1);
  display.setCursor(70, 20);
  display.print("STATUS:");
  display.setCursor(70, 30);
  display.print(status);

  // Progress Bar
  display.drawRect(0, 46, 128, 14, SSD1306_WHITE);
  int barW = map(pct, 0, 100, 0, 124);
  display.fillRect(2, 48, barW, 10, SSD1306_WHITE);

  display.display();
}

void sendHttpTelemetry(float distCm, int pct, String status, bool servoUsed) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"binId\":\"" + String(BIN_ID) + "\",";
  payload += "\"distanceCm\":" + String(distCm, 1) + ",";
  payload += "\"fillPercentage\":" + String(pct) + ",";
  payload += "\"servoActivated\":" + String(servoUsed ? "true" : "false");
  payload += "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[HTTP Telemetry] Sent OK. Code: %d\n", httpCode);
  } else {
    Serial.printf("[HTTP Telemetry] Failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}
