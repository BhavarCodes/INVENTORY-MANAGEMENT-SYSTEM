const express = require('express');
const auth = require('../middleware/auth');
const stockService = require('../services/stockService');

const router = express.Router();

// @route   POST /api/maintenance/low-stock-check
// @desc    Run low stock check now
// @access  Private
router.post('/low-stock-check', auth, async (req, res) => {
  try {
    await stockService.checkLowStock();
    res.json({ message: 'Low stock check executed' });
  } catch (error) {
    console.error('Low stock check run error:', error);
    res.status(500).json({ message: 'Failed to run low stock check' });
  }
});

// @route   POST /api/maintenance/auto-renew
// @desc    Run automatic stock renewal now
// @access  Private
router.post('/auto-renew', auth, async (req, res) => {
  try {
    await stockService.autoRenewStock();
    res.json({ message: 'Automatic stock renewal executed' });
  } catch (error) {
    console.error('Auto renew run error:', error);
    res.status(500).json({ message: 'Failed to run automatic stock renewal' });
  }
});

module.exports = router;


