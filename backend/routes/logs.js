const express = require('express');
const Log = require('../models/Log');
const router = express.Router();

// Get all logs (admin only)
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).populate('userId', 'name email');
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
