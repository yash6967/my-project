const mongoose = require('mongoose');

const requestsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID']
  },
  userEmail: {
    type: String,
    required: [true, 'Please provide a user email'],
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
  },
  requested_user_type: {
    type: String,
    enum: ['normal', 'domain_expert', 'admin', 'super_admin'],
    required: [true, 'Please specify the requested user type']
  },
  // User details for domain expert application
  name: {
    type: String,
    required: [true, 'Please provide a name']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please provide a mobile number']
  },
  address: {
    type: String,
    required: [true, 'Please provide an address']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please specify gender']
  },
  organization: {
    type: String,
    required: [true, 'Please provide organization']
  },
  role: {
    type: String,
    required: [true, 'Please provide role']
  },
  locationOfWork: {
    type: String,
    required: [true, 'Please provide location of work']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  linkedinProfile: {
    type: String,
    required: [true, 'Please provide LinkedIn profile']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Requests', requestsSchema);
