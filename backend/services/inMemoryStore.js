// In-Memory Data Store for fallback when MongoDB is not connected
// Ensures 100% out-of-the-box functionality in any environment

const initialBins = [
  {
    _id: "bin_001",
    binId: "BIN-101",
    name: "Central Park Plaza Bin",
    location: {
      address: "Central Park West, Zone A",
      lat: 40.785091,
      lng: -73.968285,
      zone: "Zone 1 - Park Area"
    },
    capacityLiters: 120,
    heightCm: 100,
    currentLevelCm: 15,
    fillPercentage: 85,
    status: "Full",
    servoOpenedCount: 42,
    batteryLevel: 94,
    lastUpdated: new Date()
  },
  {
    _id: "bin_002",
    binId: "BIN-102",
    name: "Metro Station Exit 2 Bin",
    location: {
      address: "5th Avenue Metro Entrance",
      lat: 40.758896,
      lng: -73.978718,
      zone: "Zone 2 - Transit Hub"
    },
    capacityLiters: 150,
    heightCm: 120,
    currentLevelCm: 60,
    fillPercentage: 50,
    status: "Half",
    servoOpenedCount: 88,
    batteryLevel: 88,
    lastUpdated: new Date()
  },
  {
    _id: "bin_003",
    binId: "BIN-103",
    name: "Food Court Main Bin",
    location: {
      address: "Downtown Commercial Mall, L2",
      lat: 40.712776,
      lng: -74.005974,
      zone: "Zone 3 - Commercial"
    },
    capacityLiters: 200,
    heightCm: 150,
    currentLevelCm: 120,
    fillPercentage: 20,
    status: "Empty",
    servoOpenedCount: 134,
    batteryLevel: 99,
    lastUpdated: new Date()
  },
  {
    _id: "bin_004",
    binId: "BIN-104",
    name: "University Library Lawn Bin",
    location: {
      address: "Campus Quadrangle East",
      lat: 40.807536,
      lng: -73.962573,
      zone: "Zone 4 - Education"
    },
    capacityLiters: 100,
    heightCm: 90,
    currentLevelCm: 10,
    fillPercentage: 89,
    status: "Full",
    servoOpenedCount: 29,
    batteryLevel: 79,
    lastUpdated: new Date()
  }
];

// Generate initial historical readings for each bin
function generateInitialReadings() {
  const readings = [];
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  initialBins.forEach(bin => {
    let currentPct = bin.fillPercentage;
    for (let i = 24; i >= 0; i--) {
      // Simulate historical trend over 24 hours
      const timestamp = new Date(now - i * oneHour);
      const variance = (Math.random() * 8 - 4);
      let pct = Math.max(5, Math.min(95, Math.round(currentPct - (i * 2.5) + variance)));
      if (pct < 5) pct = 5;

      let status = "Empty";
      if (pct >= 80) status = "Full";
      else if (pct >= 40) status = "Half";

      const distanceCm = Math.round(bin.heightCm * (1 - pct / 100));

      readings.push({
        _id: `read_${bin.binId}_${i}`,
        binId: bin.binId,
        distanceCm,
        fillPercentage: pct,
        status,
        servoActivated: Math.random() > 0.6,
        timestamp
      });
    }
  });

  return readings;
}

const initialAlerts = [
  {
    _id: "alt_001",
    alertId: "ALT-9001",
    binId: "BIN-101",
    binName: "Central Park Plaza Bin",
    locationName: "Central Park West, Zone A",
    alertType: "FULL_BIN",
    message: "Bin has reached 85% fill capacity. Clearance recommended.",
    fillPercentage: 85,
    status: "Active",
    createdAt: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    _id: "alt_002",
    alertId: "ALT-9002",
    binId: "BIN-104",
    binName: "University Library Lawn Bin",
    locationName: "Campus Quadrangle East",
    alertType: "FULL_BIN",
    message: "Bin fill level critical at 89%. Overflow risk high.",
    fillPercentage: 89,
    status: "Active",
    createdAt: new Date(Date.now() - 15 * 60 * 1000)
  }
];

class InMemoryStore {
  constructor() {
    this.bins = [...initialBins];
    this.readings = generateInitialReadings();
    this.alerts = [...initialAlerts];
    this.users = [
      {
        _id: "usr_001",
        name: "SmartBin Admin",
        email: "admin@smartbin.io",
        role: "admin",
        createdAt: new Date()
      }
    ];
    this.simulationActive = true;
  }

  // Bin Methods
  getAllBins() {
    return this.bins;
  }

  getBinById(binId) {
    return this.bins.find(b => b.binId === binId || b._id === binId);
  }

  createBin(binData) {
    const heightCm = Number(binData.heightCm) || 100;
    const currentLevelCm = Number(binData.currentLevelCm) || heightCm;
    const fillPercentage = Math.max(0, Math.min(100, Math.round(((heightCm - currentLevelCm) / heightCm) * 100)));
    
    let status = "Empty";
    if (fillPercentage >= 80) status = "Full";
    else if (fillPercentage >= 40) status = "Half";

    const newBin = {
      _id: `bin_${Date.now()}`,
      binId: binData.binId || `BIN-${Math.floor(100 + Math.random() * 900)}`,
      name: binData.name || "New Smart Bin",
      location: {
        address: binData.location?.address || "Unassigned Location",
        lat: Number(binData.location?.lat) || 40.7128,
        lng: Number(binData.location?.lng) || -74.0060,
        zone: binData.location?.zone || "Zone General"
      },
      capacityLiters: Number(binData.capacityLiters) || 100,
      heightCm,
      currentLevelCm,
      fillPercentage,
      status,
      servoOpenedCount: 0,
      batteryLevel: 100,
      lastUpdated: new Date()
    };

    this.bins.push(newBin);

    // Initial reading
    this.addReading({
      binId: newBin.binId,
      distanceCm: currentLevelCm,
      fillPercentage,
      status,
      servoActivated: false
    });

    return newBin;
  }

  updateBin(binId, updateData) {
    const index = this.bins.findIndex(b => b.binId === binId || b._id === binId);
    if (index === -1) return null;

    const bin = this.bins[index];
    if (updateData.name) bin.name = updateData.name;
    if (updateData.capacityLiters) bin.capacityLiters = Number(updateData.capacityLiters);
    if (updateData.heightCm) bin.heightCm = Number(updateData.heightCm);
    if (updateData.location) {
      bin.location = { ...bin.location, ...updateData.location };
    }
    bin.lastUpdated = new Date();
    this.bins[index] = bin;
    return bin;
  }

  deleteBin(binId) {
    const index = this.bins.findIndex(b => b.binId === binId || b._id === binId);
    if (index === -1) return false;
    this.bins.splice(index, 1);
    this.readings = this.readings.filter(r => r.binId !== binId);
    this.alerts = this.alerts.filter(a => a.binId !== binId);
    return true;
  }

  // Telemetry & Reading Methods
  recordReading(binId, distanceCm, servoActivated = false) {
    const bin = this.bins.find(b => b.binId === binId);
    if (!bin) return null;

    const dist = Math.max(0, Math.min(bin.heightCm, Number(distanceCm)));
    const fillPercentage = Math.max(0, Math.min(100, Math.round(((bin.heightCm - dist) / bin.heightCm) * 100)));

    let status = "Empty";
    if (fillPercentage >= 80) status = "Full";
    else if (fillPercentage >= 40) status = "Half";

    bin.currentLevelCm = dist;
    bin.fillPercentage = fillPercentage;
    bin.status = status;
    bin.lastUpdated = new Date();
    if (servoActivated) {
      bin.servoOpenedCount = (bin.servoOpenedCount || 0) + 1;
    }

    const reading = {
      _id: `read_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      binId: bin.binId,
      distanceCm: dist,
      fillPercentage,
      status,
      servoActivated: Boolean(servoActivated),
      timestamp: new Date()
    };

    this.readings.push(reading);

    // Keep max 500 readings in memory
    if (this.readings.length > 500) {
      this.readings = this.readings.slice(-500);
    }

    // Check for alerts
    if (fillPercentage >= 80) {
      const existingActive = this.alerts.find(a => a.binId === bin.binId && a.status === "Active" && a.alertType === "FULL_BIN");
      if (!existingActive) {
        this.createAlert({
          binId: bin.binId,
          binName: bin.name,
          locationName: bin.location.address,
          alertType: "FULL_BIN",
          message: `CRITICAL ALERT: ${bin.name} is ${fillPercentage}% full! Immediate collection required.`,
          fillPercentage
        });
      }
    }

    return { bin, reading };
  }

  addReading(readingData) {
    const reading = {
      _id: `read_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date(),
      ...readingData
    };
    this.readings.push(reading);
    return reading;
  }

  getReadings(binId, limit = 50) {
    let list = this.readings;
    if (binId) {
      list = list.filter(r => r.binId === binId);
    }
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  // Alert Methods
  createAlert(alertData) {
    const alert = {
      _id: `alt_${Date.now()}`,
      alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Active",
      createdAt: new Date(),
      ...alertData
    };
    this.alerts.unshift(alert);
    return alert;
  }

  getAlerts(statusFilter) {
    if (statusFilter) {
      return this.alerts.filter(a => a.status === statusFilter);
    }
    return this.alerts;
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a._id === alertId || a.alertId === alertId);
    if (!alert) return null;
    alert.status = "Resolved";
    alert.resolvedAt = new Date();
    return alert;
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a._id === alertId || a.alertId === alertId);
    if (!alert) return null;
    alert.status = "Acknowledged";
    return alert;
  }

  // Stats calculation
  getDashboardStats() {
    const totalBins = this.bins.length;
    const fullBins = this.bins.filter(b => b.status === "Full").length;
    const halfBins = this.bins.filter(b => b.status === "Half").length;
    const emptyBins = this.bins.filter(b => b.status === "Empty").length;
    
    const avgFill = totalBins > 0
      ? Math.round(this.bins.reduce((sum, b) => sum + b.fillPercentage, 0) / totalBins)
      : 0;

    const activeAlerts = this.alerts.filter(a => a.status === "Active").length;
    const totalServoOps = this.bins.reduce((sum, b) => sum + (b.servoOpenedCount || 0), 0);

    return {
      totalBins,
      fullBins,
      halfBins,
      emptyBins,
      avgFillPercentage: avgFill,
      activeAlertsCount: activeAlerts,
      totalServoOps,
      estimatedWasteKg: Math.round(this.bins.reduce((sum, b) => sum + (b.capacityLiters * (b.fillPercentage / 100) * 0.15), 0))
    };
  }
}

const store = new InMemoryStore();
module.exports = store;
