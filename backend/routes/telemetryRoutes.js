const express = require('express');
const router = express.Router();
const { postTelemetry, getHistory, getAllHistory } = require('../controllers/telemetryController');

router.post('/', postTelemetry);
router.get('/history', getAllHistory);
router.get('/history/:binId', getHistory);

module.exports = router;
