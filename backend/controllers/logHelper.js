// Helper to create a log entry
const Log = require('../models/Log');

async function createLog({ userId, action, details }) {
  try {
    await Log.create({ userId, action, details });
  } catch (err) {
    // Optionally log error to console, but don't block main flow
    console.error('Failed to create log:', err);
  }
}

module.exports = { createLog };
