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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
