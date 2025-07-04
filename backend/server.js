const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the images and profile_photo directories
app.use('/images', express.static('images'));
app.use('/profile_photo', express.static('profile_photo'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events',require('./routes/event'))
app.use('/api/requests', require('./routes/requests'));
app.use('/api/register', require('./routes/user'));
app.use('/api/user',require('./routes/user'));
app.use('/api/sessions', require('./routes/session'));
app.use('/api/slots', require('./routes/slot'));
app.use('/api/sparc', require('./routes/sparc.js'));
app.use('/api/logs', require('./routes/logs.js'));
app.get('/api/test', (req, res) => {
  res.json({ message: 'URL working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
