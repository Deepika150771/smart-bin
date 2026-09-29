const express = require('express');
const router = express.Router();
const { getAlerts, acknowledgeAlert, resolveAlert } = require('../controllers/alertController');

router.get('/', getAlerts);
router.put('/:id/acknowledge', acknowledgeAlert);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
