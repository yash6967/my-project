const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for user image upload (now stores in profile_photo folder)
const profilePhotoDir = path.join(__dirname, '../profile_photo');
if (!fs.existsSync(profilePhotoDir)) {
  fs.mkdirSync(profilePhotoDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePhotoDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route to get user events with full event details
router.get('/events', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('events');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update image paths to include full URL
    const eventsWithImages = user.events.map(event => {
      if (event.image) {
        event.image = `${req.protocol}://${req.get('host')}/images/${event.image.split('/').pop()}`;
      }
      return event;
    });

    res.status(200).json({ success: true, events: eventsWithImages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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

// Route to fetch domain experts
router.get('/domain-experts', async (req, res) => {
  try {
    const domainExperts = await User.find({ userType: 'domain_expert' })
      .select('name email mobileNumber address gender organization role locationOfWork dateOfBirth linkedinProfile userType Domain');
    
    res.status(200).json(domainExperts);
  } catch (error) {
    console.error('Error fetching domain experts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload or update user profile image
router.post('/upload-photo', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.photo = req.file.filename;
    await user.save();
    res.status(200).json({ success: true, message: 'Profile image updated', image: `${req.protocol}://${req.get('host')}/profile_photo/${user.photo}` });
  } catch (error) {
    console.error('Error uploading user image:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Route to get user profile (with full image URL)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    let imageUrl = null;
    if (user.photo) {
      imageUrl = `${req.protocol}://${req.get('host')}/profile_photo/${user.photo}`;
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        mobileNumber: user.mobileNumber,
        gender: user.gender,
        organization: user.organization,
        role: user.role,
        locationOfWork: user.locationOfWork,
        dateOfBirth: user.dateOfBirth,
        linkedinProfile: user.linkedinProfile,
        image: imageUrl
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to get the user's profile image (direct URL)
router.get('/photo', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.photo) {
      return res.status(404).json({ success: false, message: 'No profile image found' });
    }
    const imagePath = path.join(profilePhotoDir, user.photo);
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error fetching user image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to re-upload (replace) the user's profile image
router.put('/reupload-photo', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Optionally: delete the old image file from disk here
    user.photo = req.file.filename;
    await user.save();
    res.status(200).json({ success: true, message: 'Profile image replaced', image: `${req.protocol}://${req.get('host')}/profile_photo/${user.photo}` });
  } catch (error) {
    console.error('Error reuploading user image:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

