const store = require('./inMemoryStore');
const Bin = require('../models/Bin');
const BinReading = require('../models/BinReading');
const Alert = require('../models/Alert');
const { isMongoActive } = require('../config/db');

class SimulationService {
  constructor() {
    this.timer = null;
    this.isRunning = false;
    this.intervalMs = 4000; // Simulate update every 4 seconds
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Simulation Service] Live IoT telemetry simulation active (interval: 4s).');

    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[Simulation Service] Live simulation paused.');
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  async tick() {
    try {
      if (!isMongoActive()) {
        this.tickInMemory();
      } else {
        await this.tickMongo();
      }
    } catch (err) {
      console.error('[Simulation Error]', err.message);
    }
  }

  tickInMemory() {
    const bins = store.getAllBins();
    if (bins.length === 0) return;

    // Pick a random bin to update
    const randomBin = bins[Math.floor(Math.random() * bins.length)];
    
    // Simulate waste addition (1 to 5 cm level drop = fill increase)
    let fillIncrement = Math.floor(Math.random() * 4) + 1;
    let newLevel = Math.max(5, randomBin.currentLevelCm - fillIncrement);

    // 20% chance of bin reset (emptying garbage) if it was >85%
    if (randomBin.fillPercentage > 85 && Math.random() < 0.25) {
      newLevel = randomBin.heightCm;
    }

    const servoActivated = Math.random() > 0.4;
    store.recordReading(randomBin.binId, newLevel, servoActivated);
  }

  async tickMongo() {
    const bins = await Bin.find();
    if (bins.length === 0) return;

    const randomBin = bins[Math.floor(Math.random() * bins.length)];
    let fillIncrement = Math.floor(Math.random() * 4) + 1;
    let newLevel = Math.max(5, randomBin.currentLevelCm - fillIncrement);

    if (randomBin.fillPercentage > 85 && Math.random() < 0.25) {
      newLevel = randomBin.heightCm;
    }

    const servoActivated = Math.random() > 0.4;
    const dist = Math.max(0, Math.min(randomBin.heightCm, newLevel));
    const fillPercentage = Math.max(0, Math.min(100, Math.round(((randomBin.heightCm - dist) / randomBin.heightCm) * 100)));

    let status = 'Empty';
    if (fillPercentage >= 80) status = 'Full';
    else if (fillPercentage >= 40) status = 'Half';

    randomBin.currentLevelCm = dist;
    randomBin.fillPercentage = fillPercentage;
    randomBin.status = status;
    randomBin.lastUpdated = new Date();
    if (servoActivated) {
      randomBin.servoOpenedCount = (randomBin.servoOpenedCount || 0) + 1;
    }

    await randomBin.save();

    await BinReading.create({
      binId: randomBin.binId,
      distanceCm: dist,
      fillPercentage,
      status,
      servoActivated
    });

    if (fillPercentage >= 80) {
      const existingAlert = await Alert.findOne({ binId: randomBin.binId, status: 'Active', alertType: 'FULL_BIN' });
      if (!existingAlert) {
        await Alert.create({
          alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          binId: randomBin.binId,
          binName: randomBin.name,
          locationName: randomBin.location?.address || 'Location Unassigned',
          alertType: 'FULL_BIN',
          message: `CRITICAL ALERT: ${randomBin.name} (${randomBin.binId}) reached ${fillPercentage}% capacity! Immediate pickup required.`,
          fillPercentage
        });
      }
    }
  }
}

const simulator = new SimulationService();
module.exports = simulator;
