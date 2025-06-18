const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');

// Create a new session
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, sessionType, location, maxParticipants, selectedDates, selectedTimes } = req.body;
    
    // Check if user is a domain expert
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can create sessions' });
    }

    // Transform selectedDates and selectedTimes into the required format
    const sessionDates = selectedDates.map(date => ({
      date,
      timeSlots: selectedTimes[date] || [{ start: '09:00', end: '10:00' }]
    }));

    const session = new Session({
      expertId: req.user.id,
      expertName: req.user.name,
      title,
      description,
      sessionType,
      location,
      maxParticipants,
      selectedDates: sessionDates
    });

    await session.save();
    
    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get all sessions for the logged-in expert
router.get('/my-sessions', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can access this endpoint' });
    }

    const sessions = await Session.findByExpert(req.user.id);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get all published sessions (for users to browse)
router.get('/published', async (req, res) => {
  try {
    const sessions = await Session.findUpcoming();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching published sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get a specific session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('expertId', 'name email organization role')
      .populate('participants.userId', 'name email');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Update a session
router.put('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is the session owner
    if (session.expertId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this session' });
    }
    
    const { title, description, sessionType, location, maxParticipants, selectedDates, selectedTimes, status } = req.body;
    
    // Transform selectedDates and selectedTimes if provided
    let sessionDates = session.selectedDates;
    if (selectedDates && selectedTimes) {
      sessionDates = selectedDates.map(date => ({
        date,
        timeSlots: selectedTimes[date] || [{ start: '09:00', end: '10:00' }]
      }));
    }
    
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        sessionType,
        location,
        maxParticipants,
        selectedDates: sessionDates,
        status
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete a session
router.delete('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is the session owner
    if (session.expertId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this session' });
    }
    
    // Soft delete by setting isActive to false
    session.isActive = false;
    await session.save();
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Register for a session
router.post('/:id/register', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'published') {
      return res.status(400).json({ error: 'Session is not available for registration' });
    }
    
    if (session.isFull()) {
      return res.status(400).json({ error: 'Session is full' });
    }
    
    await session.addParticipant(req.user.id, req.user.name, req.user.email);
    
    res.json({
      message: 'Successfully registered for session',
      session
    });
  } catch (error) {
    console.error('Error registering for session:', error);
    if (error.message === 'Session is full' || error.message === 'User is already registered for this session') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to register for session' });
  }
});

// Unregister from a session
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await session.removeParticipant(req.user.id);
    
    res.json({
      message: 'Successfully unregistered from session',
      session
    });
  } catch (error) {
    console.error('Error unregistering from session:', error);
    res.status(500).json({ error: 'Failed to unregister from session' });
  }
});

// Get session statistics for an expert
router.get('/stats/expert', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'domain_expert') {
      return res.status(403).json({ error: 'Only domain experts can access this endpoint' });
    }

    const totalSessions = await Session.countDocuments({ expertId: req.user.id, isActive: true });
    const publishedSessions = await Session.countDocuments({ 
      expertId: req.user.id, 
      status: 'published', 
      isActive: true 
    });
    const completedSessions = await Session.countDocuments({ 
      expertId: req.user.id, 
      status: 'completed', 
      isActive: true 
    });
    const draftSessions = await Session.countDocuments({ 
      expertId: req.user.id, 
      status: 'draft', 
      isActive: true 
    });

    res.json({
      totalSessions,
      publishedSessions,
      completedSessions,
      draftSessions
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});

module.exports = router; 
