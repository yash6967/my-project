const express = require('express');
const router = express.Router();
const Slot = require('../models/slot');
const { protect } = require('../middleware/auth');

// Get expert's availability
router.get('/expert/:expertId', async (req, res) => {
  try {
    const slot = await Slot.findOne({ expertId: req.params.expertId });
    console.log("expert", req.params.expertId);
    if (!slot) {
      return res.status(404).json({ error: 'Availability not found' });
    }
    
    res.json(slot);
  } catch (error) {
    console.error('Error fetching expert availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Get availability for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const slots = await Slot.findByDate(req.params.date);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching date availability:', error);
    res.status(500).json({ error: 'Failed to fetch date availability' });
  }
});

// Create or update expert's daily availability
router.post('/daily-availability', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can set availability' });
    }

    const { dailyAvailability, blockedDates } = req.body;

    let slot = await Slot.findOne({ expertId: req.user.id });
    
    if (!slot) {
      slot = new Slot({
        expertId: req.user.id,
        dailyAvailability,
        blockedDates: blockedDates || []
      });
    } else {
      slot.dailyAvailability = dailyAvailability;
      if (blockedDates) {
        slot.blockedDates = blockedDates;
      }
    }

    await slot.save();
    
    res.json({
      message: 'Daily availability updated successfully',
      slot
    });
  } catch (error) {
    console.error('Error updating daily availability:', error);
    res.status(500).json({ error: 'Failed to update daily availability' });
  }
});

// Add date-specific availability
router.post('/date-availability', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can set date availability' });
    }

    const { date, slots } = req.body;

    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Date and slots array are required' });
    }

    let slot = await Slot.findOne({ expertId: req.user.id });
    
    if (!slot) {
      slot = new Slot({
        expertId: req.user.id,
        dailyAvailability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        },
        dateAvailability: [],
        blockedDates: []
      });
    }

    await slot.addDateAvailability(req.user.id, date, slots);
    
    res.json({
      message: 'Date availability added successfully',
      slot
    });
  } catch (error) {
    console.error('Error adding date availability:', error);
    res.status(500).json({ error: 'Failed to add date availability' });
  }
});

// Remove date-specific availability
router.delete('/date-availability/:date', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can remove date availability' });
    }

    const slot = await Slot.findOne({ expertId: req.user.id });
    
    if (!slot) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    await slot.removeDateAvailability(req.params.date);
    
    res.json({
      message: 'Date availability removed successfully',
      slot
    });
  } catch (error) {
    console.error('Error removing date availability:', error);
    res.status(500).json({ error: 'Failed to remove date availability' });
  }
});

// Get availability for a specific date (for booking purposes)
router.get('/availability/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const slots = await Slot.findByDate(date);
    
    // Transform the data to be more useful for booking
    const availability = slots.map(slot => ({
      expertId: slot.expertId._id,
      expertName: slot.expertId.name,
      expertEmail: slot.expertId.email,
      organization: slot.expertId.organization,
      role: slot.expertId.role,
      date: date,
      slots: slot.dateAvailability.find(da => da.date === date)?.slots || []
    }));

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability for date:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Get expert's availability for a date range
router.get('/expert/:expertId/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const slot = await Slot.findByExpert(req.params.expertId);
    
    if (!slot) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    // Filter date availability for the specified range
    const dateAvailability = slot.dateAvailability.filter(da => 
      da.date >= startDate && da.date <= endDate && da.isActive
    );

    res.json({
      expertId: slot.expertId,
      dailyAvailability: slot.dailyAvailability,
      dateAvailability,
      blockedDates: slot.blockedDates
    });
  } catch (error) {
    console.error('Error fetching availability range:', error);
    res.status(500).json({ error: 'Failed to fetch availability range' });
  }
});

module.exports = router; 
