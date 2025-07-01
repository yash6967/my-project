const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userType: {
    type: String,
    enum: ['normal', 'domain_expert', 'admin', 'super_admin'],
    default: 'normal'
  },
  mobileNumber: {
    type: String,
    match: [/^\d{10}$/, 'Please provide a valid mobile number'],
    required: false
  },
  address: {
    type: String,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  photo: {
    type: String,
    required: false // Stores the filename of the uploaded user image
  },
  organization: {
    type: String,
    required: false
  },
  role: {
    type: String,
    required: false
  },
  locationOfWork: {
    type: String,
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  linkedinProfile: {
    type: String,
    required: false,
    match: [/^(https?:\/\/)?([\w]+\.)?linkedin\.com\/.*$/, 'Please provide a valid LinkedIn profile URL']
  },
  Domain: {
    type: String,
    enum: ['ip_consultancy', 'company_registration', 'mentoring', 'expert_guidance'],
    required: [false, 'Please provide a domain']
  },
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};
module.exports = mongoose.model('User', userSchema);
