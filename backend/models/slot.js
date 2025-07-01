const mongoose = require('mongoose');

const timeRangeSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
});

const dailyAvailabilitySchema = new mongoose.Schema({
  monday: [timeRangeSchema],
  tuesday: [timeRangeSchema],
  wednesday: [timeRangeSchema],
  thursday: [timeRangeSchema],
  friday: [timeRangeSchema],
  saturday: [timeRangeSchema],
  sunday: [timeRangeSchema],
}, { _id: false }); // _id: false to prevent Mongoose from creating _id for subdocuments

const dateSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  message: { type: String, required: false },
  booked_by: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    isAccepted: { type: Boolean, default: false, required: false },
    isRejected: { type: Boolean, default: false, required: false }
  }],
  
}, { _id: false });

const dateAvailabilitySchema = new mongoose.Schema({
  type: { type: String, default: 'date' },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  slots: [dateSlotSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const slotSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each expert has one availability document
  },
  dailyAvailability: {
    type: dailyAvailabilitySchema,
    default: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  },
  dateAvailability: [dateAvailabilitySchema], // Array of specific date availabilities
  blockedDates: [
    {
      type: Date,
      required: true,
    }
  ],
}, { timestamps: true });

// Index for better query performance
slotSchema.index({ expertId: 1 });
slotSchema.index({ 'dateAvailability.date': 1 });
slotSchema.index({ 'dateAvailability.userId': 1 });

// Method to add date availability
slotSchema.methods.addDateAvailability = function(userId, date, slots) {
  // Remove existing availability for this date if it exists
  this.dateAvailability = this.dateAvailability.filter(da => da.date !== date);
  
  // Add new date availability
  this.dateAvailability.push({
    type: 'date',
    userId,
    date,
    slots,
    isActive: true
  });
  
  return this.save();
};

// Method to remove date availability
slotSchema.methods.removeDateAvailability = function(date) {
  this.dateAvailability = this.dateAvailability.filter(da => da.date !== date);
  return this.save();
};

// Method to get availability for a specific date
slotSchema.methods.getAvailabilityForDate = function(date) {
  // First check for specific date availability
  const specificDate = this.dateAvailability.find(da => da.date === date && da.isActive);
  if (specificDate) {
    return specificDate.slots;
  }
  
  // If no specific date, check daily availability based on day of week
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  return this.dailyAvailability[dayOfWeek] || [];
};

// Static method to find slots by expert
slotSchema.statics.findByExpert = function(expertId) {
  return this.findOne({ expertId });
};

// Static method to find all date availabilities for a specific date
slotSchema.statics.findByDate = function(date) {
  return this.find({
    'dateAvailability.date': date,
    'dateAvailability.isActive': true
  }).populate('expertId', 'name email organization role');
};

module.exports = mongoose.model('Slot', slotSchema);
