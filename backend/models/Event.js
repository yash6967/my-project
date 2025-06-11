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
        type: String,
        required: true,
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
});

module.exports = mongoose.model('Event', eventSchema);
