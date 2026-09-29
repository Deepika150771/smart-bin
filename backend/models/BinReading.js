const mongoose = require('mongoose');

const BinReadingSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    index: true
  },
  distanceCm: {
    type: Number,
    required: true
  },
  fillPercentage: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Empty', 'Half', 'Full', 'Offline', 'Maintenance'],
    required: true
  },
  servoActivated: {
    type: Boolean,
    default: false
  },
  rawDistance: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('BinReading', BinReadingSchema);
