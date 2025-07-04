const express = require('express');
const router = express.Router();
const Slot = require('../models/slot');
const { protect } = require('../middleware/auth');
const { createLog } = require('../controllers/logHelper');

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

    // Ensure each slot has a message field (optional)
    const slotsWithMessage = slots.map(slot => ({
      ...slot,
      message: slot.message || ''
    }));

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

    await slot.addDateAvailability(req.user.id, date, slotsWithMessage);
    
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
      slots: (slot.dateAvailability.find(da => da.date === date)?.slots || []).map(s => ({
        startTime: s.startTime,
        endTime: s.endTime,
        message: s.message || '',
        booked_by: s.booked_by || []
      }))
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

// Book a specific slot for a user
router.post('/book', protect, async (req, res) => {
  try {
    const { expertId, date, startTime, endTime, message } = req.body;
    // message should be optional
    if (!expertId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const slotDoc = await Slot.findOne({ expertId });
    if (!slotDoc) return res.status(404).json({ error: 'Expert not found' });

    // Find the date availability
    const dateAvail = slotDoc.dateAvailability.find(da => da.date === date && da.isActive);
    if (!dateAvail) return res.status(404).json({ error: 'No availability for this date' });

    // Find the slot
    const slot = dateAvail.slots.find(s => s.startTime === startTime && s.endTime === endTime);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });

    // Only allow booking if booked_by is empty or all bookings are rejected
    const isBookable = !slot.booked_by || slot.booked_by.length === 0 ||
      slot.booked_by.every(b => b.isRejected === true);

    if (!isBookable) {
      return res.status(400).json({ error: 'Slot is already booked and not available' });
    }

    // Prevent double booking by the same user
    if (slot.booked_by && slot.booked_by.some(b => b.userId.toString() === req.user.id)) {
      return res.status(400).json({ error: 'You have already booked this slot' });
    }

    // Add user to booked_by with status pending
    slot.booked_by = slot.booked_by || [];
    slot.booked_by.push({
      userId: req.user.id,
      isAccepted: false,
      isRejected: false
    });

    // Optionally update the message if provided
    if (typeof message === 'string') {
      slot.message = message;
      // console.log("message", message);
    }

    await slotDoc.save();
    // Log expert booking
    await createLog({
      userId: req.user.id,
      action: 'expert_booking',
      details: { expertId, date, startTime, endTime }
    });

    res.json({ message: `Slot bookasdfed successfully`, slotDoc });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(500).json({ error: 'Failed to book slot' });
  }
});

// Get all slots booked by the current user (include status)
router.get('/booked-by-user', protect, async (req, res) => {
  try {
    // Find all Slot documents where any dateAvailability.slots.booked_by.userId contains req.user.id
    const slots = await Slot.find({
      'dateAvailability.slots.booked_by.userId': req.user.id
    }).populate('expertId', 'name email organization role');

    // Flatten the results to get each booked slot with expert info, date, and time, and status
    const bookedSlots = [];
    slots.forEach(slotDoc => {
      slotDoc.dateAvailability.forEach(dateAvail => {
        dateAvail.slots.forEach(slot => {
          if (slot.booked_by) {
            slot.booked_by.forEach(b => {
              if (b.userId && b.userId.toString() === req.user.id) {
                bookedSlots.push({
                  expert: slotDoc.expertId,
                  date: dateAvail.date,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  message: slot.message || '',
                  isAccepted: b.isAccepted,
                  isRejected: b.isRejected
                });
              }
            });
          }
        });
      });
    });

    res.json(bookedSlots);
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
});

// Cancel a booking for a user
router.delete('/cancel-booking', protect, async (req, res) => {
  try {
    const { expertId, date, startTime, endTime } = req.body;
    if (!expertId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const slotDoc = await Slot.findOne({ expertId });
    if (!slotDoc) return res.status(404).json({ error: 'Expert not found' });
    // Find the date availability
    const dateAvail = slotDoc.dateAvailability.find(da => da.date === date && da.isActive);
    if (!dateAvail) return res.status(404).json({ error: 'No availability for this date' });
    // Find the slot
    const slot = dateAvail.slots.find(s => s.startTime === startTime && s.endTime === endTime);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });
    // Remove user from booked_by
    if (slot.booked_by) {
      slot.booked_by = slot.booked_by.filter(b => !b.userId || b.userId.toString() !== req.user.id);
    }
    await slotDoc.save();
    // Log expert booking cancellation
    await createLog({
      userId: req.user.id,
      action: 'expert_booking_cancel',
      details: { expertId, date, startTime, endTime }
    });
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get all bookings for the current domain expert (include status)
router.get('/bookings-for-expert', protect, async (req, res) => {
  try {
    // Only allow domain experts
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can view their bookings' });
    }
    // Find the expert's slot document
    const slotDoc = await Slot.findOne({ expertId: req.user.id });
    if (!slotDoc) return res.json([]);
    // Gather all bookings (where booked_by is not empty)
    const bookings = [];
    for (const dateAvail of slotDoc.dateAvailability) {
      for (const slot of dateAvail.slots) {
        if (slot.booked_by && slot.booked_by.length > 0) {
          for (const b of slot.booked_by) {
            bookings.push({
              userId: b.userId,
              date: dateAvail.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              message: slot.message || '', // Added the message field
              isAccepted: b.isAccepted,
              isRejected: b.isRejected,
            });
          }
        }
      }
    }
    // Populate user info for all userIds
    const userIds = bookings.map(b => b.userId);
    const User = require('../models/User');
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    // Attach user info to each booking
    const bookingsWithUser = bookings.map(b => ({
      ...b,
      user: users.find(u => u._id.toString() === b.userId.toString())
    }));
    res.json(bookingsWithUser);
  } catch (error) {
    console.error('Error fetching expert bookings:', error);
    res.status(500).json({ error: 'Failed to fetch expert bookings' });
  }
});

// Expert accepts or rejects a booking request for a slot
router.post('/booking-status', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can update booking status' });
    }
    const { date, startTime, endTime, userId, isAccepted, isRejected } = req.body;
    if (!date || !startTime || !endTime || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const slotDoc = await Slot.findOne({ expertId: req.user.id });
    if (!slotDoc) return res.status(404).json({ error: 'Slot not found' });

    const dateAvail = slotDoc.dateAvailability.find(da => da.date === date && da.isActive);
    if (!dateAvail) return res.status(404).json({ error: 'No availability for this date' });

    const slot = dateAvail.slots.find(s => s.startTime === startTime && s.endTime === endTime);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });

    const booking = slot.booked_by.find(b => b.userId && b.userId.toString() === userId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Accept or reject logic
    if (isAccepted) {
      booking.isAccepted = true;
      booking.isRejected = false;
      // Optionally, reject all other bookings for this slot
      slot.booked_by.forEach(b => {
        if (b.userId && b.userId.toString() !== userId) {
          b.isAccepted = false;
          b.isRejected = true;
        }
      });
    } else if (isRejected) {
      booking.isAccepted = false;
      booking.isRejected = true;
    }

    await slotDoc.save();

    // Log accept/reject action
    const User = require('../models/User');
    const expert = await User.findById(req.user.id).select('name email');
    const logDetails = {
      expertId: req.user.id,
      expertName: expert?.name || '',
      userId,
      date,
      startTime,
      endTime
    };
    if (isAccepted) {
      await createLog({
        userId: req.user.id,
        action: 'booking_accepted',
        details: logDetails
      });
    } else if (isRejected) {
      await createLog({
        userId: req.user.id,
        action: 'booking_rejected',
        details: logDetails
      });
    }

    res.json({ message: 'Booking status updated', slotDoc });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Edit the message field of a specific slot (by expert)
router.put('/edit-message', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can edit slot messages' });
    }

    const { date, startTime, endTime, message } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the expert's slot document
    const slotDoc = await Slot.findOne({ expertId: req.user.id });
    if (!slotDoc) return res.status(404).json({ error: 'Slot document not found' });

    // Find the date availability
    const dateAvail = slotDoc.dateAvailability.find(da => da.date === date && da.isActive);
    if (!dateAvail) return res.status(404).json({ error: 'No availability for this date' });

    // Find the slot
    const slot = dateAvail.slots.find(s => s.startTime === startTime && s.endTime === endTime);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });

    // Update the message
    slot.message = message || '';

    await slotDoc.save();

    res.json({ message: 'Slot message updated successfully', slot });
  } catch (error) {
    console.error('Error updating slot message:', error);
    res.status(500).json({ error: 'Failed to update slot message' });
  }
});

module.exports = router;
