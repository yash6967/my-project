const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');

// Create a new request
router.post('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const newRequest = new Request({ ...req.body, userId });
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all requests with email and requested user type
router.get('/all-requests', async (req, res) => {
  try {
    console.log('Fetching all requests from MongoDB');
    const requests = await Request.find({}).populate('userId', 'name email userType');
    console.log('Fetched requests:', requests);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all requests
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const requests = await Request.find({ userId });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update request status (approve/reject)
router.put('/:requestId/status', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = status;
    
    // If approved, update user type
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.userId, { 
        userType: request.requested_user_type 
      });
    }
    
    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a request by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedRequest = await Request.findByIdAndDelete(req.params.id);
    if (!deletedRequest) {
      return res.status(404).json({ error: 'Requests not found' });
    }
    res.status(200).json({ message: 'Requests deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
