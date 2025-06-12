const express = require('express');
const Event = require('../models/Event');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../images'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Enhanced error handling and debugging for image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Debugging log
    console.log('Uploaded File:', req.file); // Debugging log

    const eventData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      endTime: req.body.endTime,
      location: req.body.location,
      category: req.body.category,
      image: req.file ? `${req.file.filename}` : null, // Make photo optional
      organizer: req.body.organizer,
      availableSeats: req.body.availableSeats, // Ensure availableSeats is included
      registeredUsers: req.body.registeredUsers || [], // Default to an empty array
    };

    const event = new Event(eventData);
    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Error creating event:', error); // Debugging log
    res.status(500).json({ success: false, message: 'Something went wrong!', error: error.message });
  }
});

// Get all events or search by title
router.get('/', async (req, res) => {
  try {
    const { title } = req.query;
    const events = title
      ? await Event.find({ title: new RegExp(title, 'i') })
      : await Event.find();

    // Update image paths to include full URL
    const updatedEvents = events.map((event) => {
      if (event.image) {
        event.image = `${req.protocol}://${req.get('host')}/images/${event.image.split('/').pop()}`;
      }
      return event;
    });

    res.status(200).json(updatedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single event by ID
router.get('/:title', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      image: req.file ? `${req.file.filename}` : req.body.image, // Update image if a new one is uploaded
    };

    const event = await Event.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error); // Debugging log
    res.status(500).json({ success: false, message: 'Something went wrong!', error: error.message });
  }
});

// Register a user for an event
router.put('/:id/register', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('Params ID:', req.params.id);

    const event = await Event.findById(req.params.id);
    console.log("event object : ", event);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.availableSeats <= 0) {
      return res.status(400).json({ error: 'No available seats' });
    }

    if (event.registeredUsers.includes(userId)) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // console.log("a");
    event.availableSeats -= 1;
    // console.log("b");
    event.registeredUsers.push(userId);
    // console.log("c");
    await event.save();
    // console.log("d");

    res.status(200).json({ message: 'User registered successfully', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel a user's registration for an event
router.put('/:id/cancel-register', async (req, res) => {
  try {
    const { userId } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.registeredUsers.includes(userId)) {
      return res.status(400).json({ error: 'User not registered for this event' });
    }

    event.availableSeats += 1;
    event.registeredUsers = event.registeredUsers.filter((id) => id !== userId);
    await event.save();

    res.status(200).json({ message: 'User registration canceled successfully', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an event by ID
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
