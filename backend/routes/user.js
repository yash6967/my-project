const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Route to add an event ID to the user's events array
router.put('/event', protect, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add the event ID to the user's events array if not already present
    if (!user.events.includes(eventId)) {
      user.events.push(eventId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Event registered successfully', events: user.events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

