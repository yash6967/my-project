const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const sessionDateSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD format
  timeSlots: [timeSlotSchema],
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
    default: 'Session'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sessionType: {
    type: String,
    enum: ['workshop', 'seminar', 'consultation', 'lecture'],
    default: 'workshop'
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  maxParticipants: {
    type: Number,
    min: 1,
    max: 200,
    default: 50
  },
  selectedDates: [sessionDateSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft'
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userEmail: String,
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index for better query performance
sessionSchema.index({ expertId: 1, status: 1 });
sessionSchema.index({ 'selectedDates.date': 1 });
sessionSchema.index({ status: 1, isActive: 1 });

// Virtual for getting total participants count
sessionSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for getting upcoming dates
sessionSchema.virtual('upcomingDates').get(function() {
  const today = new Date().toISOString().split('T')[0];
  return this.selectedDates.filter(sessionDate => sessionDate.date >= today);
});

// Method to check if session is full
sessionSchema.methods.isFull = function() {
  return this.participants.length >= this.maxParticipants;
};

// Method to add participant
sessionSchema.methods.addParticipant = function(userId, userName, userEmail) {
  if (this.isFull()) {
    throw new Error('Session is full');
  }
  
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already registered for this session');
  }
  
  this.participants.push({
    userId,
    userName,
    userEmail
  });
  
  return this.save();
};

// Method to remove participant
sessionSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.userId.toString() !== userId.toString());
  return this.save();
};

// Static method to find sessions by expert
sessionSchema.statics.findByExpert = function(expertId) {
  return this.find({ expertId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find upcoming sessions
sessionSchema.statics.findUpcoming = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.find({
    'selectedDates.date': { $gte: today },
    status: 'published',
    isActive: true
  }).populate('expertId', 'name email organization role').sort({ 'selectedDates.date': 1 });
};

// Ensure virtuals are included when converting to JSON
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema); 
