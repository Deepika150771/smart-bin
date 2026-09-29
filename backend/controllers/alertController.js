const Alert = require('../models/Alert');
const store = require('../services/inMemoryStore');
const { isMongoActive } = require('../config/db');

// @desc    Get all alerts
// @route   GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const { status } = req.query;

    if (!isMongoActive()) {
      const alerts = store.getAlerts(status);
      return res.json({ success: true, count: alerts.length, data: alerts });
    }

    const filter = status ? { status } : {};
    const alerts = await Alert.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge an alert
// @route   PUT /api/alerts/:id/acknowledge
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoActive()) {
      const alert = store.acknowledgeAlert(id);
      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
      return res.json({ success: true, message: 'Alert acknowledged', data: alert });
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.status = 'Acknowledged';
    await alert.save();

    res.json({ success: true, message: 'Alert acknowledged', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve an alert
// @route   PUT /api/alerts/:id/resolve
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoActive()) {
      const alert = store.resolveAlert(id);
      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
      return res.json({ success: true, message: 'Alert resolved', data: alert });
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.status = 'Resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ success: true, message: 'Alert resolved', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
