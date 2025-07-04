const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // id: {
    //     type: Number,
    //     required: true,
    //     unique: true,
    // },
    title:{
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    category: {
        type: [String],
        required: true,
        validate: {
            validator: function(categories) {
                return categories && categories.length > 0;
            },
            message: 'At least one category must be selected'
        }
    },
    image: {
        type: String,
        required: false, // Made the image field optional
    },
    registeredUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    booked_experts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    // photo: {
    //     type: String,
    //     required: false,
    // },
    organizer: {
        type: String,
        required: true,
    },
    availableSeats: {
        type: Number,
        required: true,
    },
    urls: {
        type: [String],
        required: false, // Optional array of URLs (e.g., PDF links, resources)
        default: [],
    },
}, { timestamps: true }); // Add timestamps to track createdAt and updatedAt

module.exports = mongoose.model('Event', eventSchema);
