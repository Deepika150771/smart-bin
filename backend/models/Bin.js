const mongoose = require('mongoose');

const BinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a bin name'],
    trim: true
  },
  location: {
    address: { type: String, default: 'Unassigned Address' },
    lat: { type: Number, default: 40.7128 },
    lng: { type: Number, default: -74.0060 },
    zone: { type: String, default: 'Zone A' }
  },
  capacityLiters: {
    type: Number,
    default: 100
  },
  heightCm: {
    type: Number,
    default: 100,
    description: 'Distance in cm from ultrasonic sensor at top to bin bottom'
  },
  currentLevelCm: {
    type: Number,
    default: 100
  },
  fillPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Empty', 'Half', 'Full', 'Offline', 'Maintenance'],
    default: 'Empty'
  },
  servoOpenedCount: {
    type: Number,
    default: 0
  },
  batteryLevel: {
    type: Number,
    default: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate fill percentage and status
BinSchema.pre('save', function(next) {
  if (this.isModified('currentLevelCm') || this.isModified('heightCm')) {
    const height = this.heightCm || 100;
    const distance = Math.max(0, Math.min(height, this.currentLevelCm));
    this.fillPercentage = Math.max(0, Math.min(100, Math.round(((height - distance) / height) * 100)));
    
    if (this.fillPercentage >= 80) {
      this.status = 'Full';
    } else if (this.fillPercentage >= 40) {
      this.status = 'Half';
    } else {
      this.status = 'Empty';
    }
  }
  next();
});

module.exports = mongoose.model('Bin', BinSchema);
