const Bin = require('../models/Bin');
const BinReading = require('../models/BinReading');
const Alert = require('../models/Alert');
const store = require('../services/inMemoryStore');
const { isMongoActive } = require('../config/db');

// @desc    Get all registered smart bins
// @route   GET /api/bins
exports.getBins = async (req, res) => {
  try {
    if (!isMongoActive()) {
      const bins = store.getAllBins();
      const stats = store.getDashboardStats();
      return res.json({ success: true, count: bins.length, stats, data: bins });
    }

    const bins = await Bin.find().sort({ binId: 1 });
    
    // Compute stats
    const totalBins = bins.length;
    const fullBins = bins.filter(b => b.status === 'Full').length;
    const halfBins = bins.filter(b => b.status === 'Half').length;
    const emptyBins = bins.filter(b => b.status === 'Empty').length;
    const avgFillPercentage = totalBins > 0
      ? Math.round(bins.reduce((sum, b) => sum + b.fillPercentage, 0) / totalBins)
      : 0;

    const activeAlertsCount = await Alert.countDocuments({ status: 'Active' });
    const totalServoOps = bins.reduce((sum, b) => sum + (b.servoOpenedCount || 0), 0);

    const stats = {
      totalBins,
      fullBins,
      halfBins,
      emptyBins,
      avgFillPercentage,
      activeAlertsCount,
      totalServoOps,
      estimatedWasteKg: Math.round(bins.reduce((sum, b) => sum + (b.capacityLiters * (b.fillPercentage / 100) * 0.15), 0))
    };

    res.json({ success: true, count: bins.length, stats, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single bin by ID
// @route   GET /api/bins/:id
exports.getBinById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoActive()) {
      const bin = store.getBinById(id);
      if (!bin) return res.status(404).json({ success: false, message: 'Bin not found' });
      return res.json({ success: true, data: bin });
    }

    const bin = await Bin.findOne({ $or: [{ binId: id }, { _id: id }] });
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    res.json({ success: true, data: bin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new bin
// @route   POST /api/bins
exports.createBin = async (req, res) => {
  try {
    const { binId, name, location, capacityLiters, heightCm, currentLevelCm } = req.body;

    if (!isMongoActive()) {
      const newBin = store.createBin({ binId, name, location, capacityLiters, heightCm, currentLevelCm });
      return res.status(201).json({ success: true, message: 'Bin registered successfully', data: newBin });
    }

    const existing = await Bin.findOne({ binId: binId?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Bin ID ${binId} is already registered` });
    }

    const height = Number(heightCm) || 100;
    const distance = currentLevelCm !== undefined ? Number(currentLevelCm) : height;

    const bin = new Bin({
      binId: binId || `BIN-${Math.floor(100 + Math.random() * 900)}`,
      name: name || 'New Smart Bin',
      location: {
        address: location?.address || 'Unassigned Location',
        lat: Number(location?.lat) || 40.7128,
        lng: Number(location?.lng) || -74.0060,
        zone: location?.zone || 'Zone 1'
      },
      capacityLiters: Number(capacityLiters) || 100,
      heightCm: height,
      currentLevelCm: distance
    });

    await bin.save();

    // Create initial reading
    await BinReading.create({
      binId: bin.binId,
      distanceCm: bin.currentLevelCm,
      fillPercentage: bin.fillPercentage,
      status: bin.status,
      servoActivated: false
    });

    res.status(201).json({ success: true, message: 'Bin registered successfully', data: bin });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update bin configuration
// @route   PUT /api/bins/:id
exports.updateBin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoActive()) {
      const updated = store.updateBin(id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Bin not found' });
      return res.json({ success: true, data: updated });
    }

    const bin = await Bin.findOne({ $or: [{ binId: id }, { _id: id }] });
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    if (req.body.name) bin.name = req.body.name;
    if (req.body.capacityLiters) bin.capacityLiters = Number(req.body.capacityLiters);
    if (req.body.heightCm) bin.heightCm = Number(req.body.heightCm);
    if (req.body.location) {
      bin.location = { ...bin.location, ...req.body.location };
    }
    bin.lastUpdated = new Date();

    await bin.save();
    res.json({ success: true, message: 'Bin updated successfully', data: bin });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete bin
// @route   DELETE /api/bins/:id
exports.deleteBin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoActive()) {
      const ok = store.deleteBin(id);
      if (!ok) return res.status(404).json({ success: false, message: 'Bin not found' });
      return res.json({ success: true, message: 'Bin removed successfully' });
    }

    const bin = await Bin.findOneAndDelete({ $or: [{ binId: id }, { _id: id }] });
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    await BinReading.deleteMany({ binId: bin.binId });
    await Alert.deleteMany({ binId: bin.binId });

    res.json({ success: true, message: `Bin ${bin.binId} removed successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Empty/Clear bin level (Simulated garbage collection)
// @route   POST /api/bins/:id/empty
exports.emptyBin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoActive()) {
      const bin = store.getBinById(id);
      if (!bin) return res.status(404).json({ success: false, message: 'Bin not found' });
      
      const record = store.recordReading(bin.binId, bin.heightCm, false);
      return res.json({ success: true, message: `Bin ${bin.binId} marked as EMPTIED`, data: record.bin });
    }

    const bin = await Bin.findOne({ $or: [{ binId: id }, { _id: id }] });
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    bin.currentLevelCm = bin.heightCm;
    bin.fillPercentage = 0;
    bin.status = 'Empty';
    bin.lastUpdated = new Date();
    await bin.save();

    await BinReading.create({
      binId: bin.binId,
      distanceCm: bin.heightCm,
      fillPercentage: 0,
      status: 'Empty',
      servoActivated: false
    });

    // Resolve any active full alerts for this bin
    await Alert.updateMany({ binId: bin.binId, status: 'Active' }, { status: 'Resolved', resolvedAt: new Date() });

    res.json({ success: true, message: `Bin ${bin.binId} marked as EMPTIED`, data: bin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
