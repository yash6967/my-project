const express = require('express');
const { check } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
// const token = user.getSignedJwtToken();

// Validation middleware
const signupValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

// Route to toggle userType between 'normal' and 'service_provider'
router.put('/users/:id/toggle-usertype', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle userType
    user.userType = user.userType === 'normal' ? 'service_provider' : 'normal';
    await user.save();

    res.status(200).json({ message: 'User type updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch users based on their userType (normal or expert)
router.get('/users', async (req, res) => {
  try {
    const userType = req.query.userType;
    const users = await User.find({ userType }).select('name mobileNumber email');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route to fetch all users
router.get('/allusers', async (req, res) => {
  try {
    const users = await User.find().select('name email mobileNumber userType');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route to fetch user details by userId
router.get('/user-details/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('GET /user-details/:userId - Fetching user:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User details fetched successfully:', user);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to update user details by userId
router.put('/user-details/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;
    
    console.log('PUT /user-details/:userId - Updating user:', userId);
    console.log('Update data received:', updates);

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('name email mobileNumber address gender organization role locationOfWork dateOfBirth linkedinProfile userType Domain');

    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User updated successfully:', user);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to handle domain expert application
router.post('/apply-domain-expert', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is authenticated and user ID is available

    const updates = {
      mobileNumber: req.body.mobileNumber,
      gender: req.body.gender,
      photo: req.body.photo,
      organization: req.body.organization,
      role: req.body.role,
      locationOfWork: req.body.locationOfWork,
      dateOfBirth: req.body.dateOfBirth,
      linkedinProfile: req.body.linkedinProfile,
      domain: req.body.domain,
      cv: req.file ? req.file.path : undefined, // Assuming file upload middleware is used
    };

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Application submitted successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
