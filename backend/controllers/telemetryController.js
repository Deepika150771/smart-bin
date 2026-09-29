const Bin = require('../models/Bin');
const BinReading = require('../models/BinReading');
const Alert = require('../models/Alert');
const store = require('../services/inMemoryStore');
const { isMongoActive } = require('../config/db');

// @desc    Receive raw sensor reading from ESP32 or simulated device
// @route   POST /api/telemetry
// Payload: { binId: "BIN-101", distanceCm: 25.4, servoActivated: true }
exports.postTelemetry = async (req, res) => {
  try {
    const { binId, distanceCm, servoActivated, rawDistance } = req.body;

    if (!binId || distanceCm === undefined) {
      return res.status(400).json({ success: false, message: 'binId and distanceCm are required' });
    }

    if (!isMongoActive()) {
      const record = store.recordReading(binId, distanceCm, servoActivated);
      if (!record) {
        return res.status(404).json({ success: false, message: `Bin ${binId} not found in system` });
      }
      return res.status(200).json({
        success: true,
        message: 'Telemetry received',
        bin: record.bin,
        reading: record.reading
      });
    }

    const bin = await Bin.findOne({ binId: binId.toUpperCase() });
    if (!bin) {
      return res.status(404).json({ success: false, message: `Bin ID ${binId} not registered` });
    }

    const dist = Math.max(0, Math.min(bin.heightCm, Number(distanceCm)));
    const fillPercentage = Math.max(0, Math.min(100, Math.round(((bin.heightCm - dist) / bin.heightCm) * 100)));

    let status = 'Empty';
    if (fillPercentage >= 80) status = 'Full';
    else if (fillPercentage >= 40) status = 'Half';

    bin.currentLevelCm = dist;
    bin.fillPercentage = fillPercentage;
    bin.status = status;
    bin.lastUpdated = new Date();
    if (servoActivated) {
      bin.servoOpenedCount = (bin.servoOpenedCount || 0) + 1;
    }

    await bin.save();

    const reading = await BinReading.create({
      binId: bin.binId,
      distanceCm: dist,
      fillPercentage,
      status,
      servoActivated: Boolean(servoActivated),
      rawDistance: rawDistance || dist
    });

    // Generate Alert if full and no active alert exists
    if (fillPercentage >= 80) {
      const existingAlert = await Alert.findOne({ binId: bin.binId, status: 'Active', alertType: 'FULL_BIN' });
      if (!existingAlert) {
        await Alert.create({
          alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          binId: bin.binId,
          binName: bin.name,
          locationName: bin.location?.address || 'Location Unassigned',
          alertType: 'FULL_BIN',
          message: `CRITICAL ALERT: ${bin.name} (${bin.binId}) reached ${fillPercentage}% capacity! Immediate pickup required.`,
          fillPercentage
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry received successfully',
      data: {
        binId: bin.binId,
        fillPercentage,
        status,
        distanceCm: dist
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get historical readings for a bin
// @route   GET /api/telemetry/history/:binId
exports.getHistory = async (req, res) => {
  try {
    const { binId } = req.params;
    const limit = Number(req.query.limit) || 40;

    if (!isMongoActive()) {
      const readings = store.getReadings(binId, limit);
      return res.json({ success: true, count: readings.length, data: readings });
    }

    const readings = await BinReading.find({ binId: binId.toUpperCase() })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({ success: true, count: readings.length, data: readings.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system-wide historical aggregate trends
// @route   GET /api/telemetry/history
exports.getAllHistory = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;

    if (!isMongoActive()) {
      const readings = store.getReadings(null, limit);
      return res.json({ success: true, count: readings.length, data: readings });
    }

    const readings = await BinReading.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({ success: true, count: readings.length, data: readings.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
