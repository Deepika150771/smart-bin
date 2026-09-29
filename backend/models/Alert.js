const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  binId: {
    type: String,
    required: true,
    index: true
  },
  binName: {
    type: String,
    required: true
  },
  locationName: {
    type: String
  },
  alertType: {
    type: String,
    enum: ['FULL_BIN', 'CRITICAL_HIGH', 'SENSOR_FAULT', 'LID_STUCK', 'BATTERY_LOW'],
    default: 'FULL_BIN'
  },
  message: {
    type: String,
    required: true
  },
  fillPercentage: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Acknowledged', 'Resolved'],
    default: 'Active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Alert', AlertSchema);
