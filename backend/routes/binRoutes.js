const express = require('express');
const router = express.Router();
const { getBins, getBinById, createBin, updateBin, deleteBin, emptyBin } = require('../controllers/binController');

router.route('/')
  .get(getBins)
  .post(createBin);

router.route('/:id')
  .get(getBinById)
  .put(updateBin)
  .delete(deleteBin);

router.post('/:id/empty', emptyBin);

module.exports = router;
