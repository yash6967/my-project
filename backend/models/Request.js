const mongoose = require('mongoose');

const requestsSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'Please provide a user email'],
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
  },
  requested_user_type: {
    type: String,
    enum: ['normal', 'service_provider', 'admin', 'super_admin'],
    required: [true, 'Please specify the requested user type']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Requests', requestsSchema);
