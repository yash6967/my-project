import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import './AvailabilityManager.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const AvailabilityManager = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('schedule'); // 'calendar' or 'schedule'
  const [activeScheduleTab, setActiveScheduleTab] = useState('default'); // 'default' or 'new-schedule'

  // State for daily availability
  const [dailyAvailability, setDailyAvailability] = useState({
    monday: [{ start: '09:00', end: '10:00' }, { start: '12:00', end: '13:00' }], // Example default slots
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  // State for blocked dates
  const [blockedDates, setBlockedDates] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.userType !== 'domain_expert') {
      navigate('/dashboard');
      return;
    }
    // In a real application, you would fetch existing availability data here
    // For now, we use the default initial state.
  }, [user, navigate]);

  const weekdays = [
    { value: 'monday', label: 'Monday', dayIndex: 1 },
    { value: 'tuesday', label: 'Tuesday', dayIndex: 2 },
    { value: 'wednesday', label: 'Wednesday', dayIndex: 3 },
    { value: 'thursday', label: 'Thursday', dayIndex: 4 },
    { value: 'friday', label: 'Friday', dayIndex: 5 },
    { value: 'saturday', label: 'Saturday', dayIndex: 6 },
    { value: 'sunday', label: 'Sunday', dayIndex: 0 }
  ];

  // Time options for dropdowns (every 30 minutes)
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  const handleDayToggle = (day) => {
    setDailyAvailability(prev => {
      const newAvailability = { ...prev };
      if (newAvailability[day] && newAvailability[day].length > 0) {
        // If slots exist, uncheck means clear all slots for this day
        newAvailability[day] = [];
      } else {
        // If no slots, check means add a default slot
        newAvailability[day] = [{ start: '09:00', end: '10:00' }];
      }
      return newAvailability;
    });
  };

  const handleTimeChange = (day, index, field, value) => {
    setDailyAvailability(prev => {
      const newAvailability = { ...prev };
      newAvailability[day][index][field] = value;
      return newAvailability;
    });
  };

  const handleAddTimeSlot = (day) => {
    setDailyAvailability(prev => ({
      ...prev,
      [day]: [...prev[day], { start: '09:00', end: '10:00' }]
    }));
  };

  const handleRemoveTimeSlot = (day, index) => {
    setDailyAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const handleAddBlockedDate = () => {
    const newBlockedDate = prompt("Enter date to block (YYYY-MM-DD):");
    if (newBlockedDate) {
      setBlockedDates(prev => [...prev, newBlockedDate]);
    }
  };

  const handleRemoveBlockedDate = (dateToRemove) => {
    setBlockedDates(prev => prev.filter(date => date !== dateToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const availabilityData = {
        dailyAvailability,
        blockedDates,
        expertId: user.id,
        expertName: user.name,
      };

      console.log('Saving Availability:', availabilityData);
      // In a real app, you would send this to your backend
      // const response = await fetch(`${BACKEND_URL}api/availability`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(availabilityData),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to save availability');
      // }
      
      setTimeout(() => {
        toast.success('Availability saved successfully!');
        // Optionally, navigate back to dashboard or show confirmation
      }, 1000);
      
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability-container">
      <div className="availability-tabs">
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="schedule-content">
          <div className="schedule-header">
            <button
              className={`schedule-tab-btn ${activeScheduleTab === 'default' ? 'active' : ''}`}
              onClick={() => setActiveScheduleTab('default')}
            >
              Default
            </button>
            <button
              className={`schedule-tab-btn ${activeScheduleTab === 'new-schedule' ? 'active' : ''}`}
              onClick={() => setActiveScheduleTab('new-schedule')}
            >
              + New Schedule
            </button>
            <button className="save-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          {activeScheduleTab === 'default' && (
            <div className="default-schedule-section">
              <h3>Default</h3>
              <form onSubmit={handleSubmit} className="availability-form">
                <div className="daily-availability-grid">
                  {weekdays.map(day => (
                    <div key={day.value} className="day-row">
                      <label className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={dailyAvailability[day.value]?.length > 0}
                          onChange={() => handleDayToggle(day.value)}
                        />
                        <span>{day.label}</span>
                      </label>
                      <div className="time-slots-container">
                        {dailyAvailability[day.value]?.length > 0 ? (
                          dailyAvailability[day.value].map((slot, index) => (
                            <div key={index} className="time-slot-group">
                              <select
                                value={slot.start}
                                onChange={(e) => handleTimeChange(day.value, index, 'start', e.target.value)}
                              >
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                              </select>
                              <span>-</span>
                              <select
                                value={slot.end}
                                onChange={(e) => handleTimeChange(day.value, index, 'end', e.target.value)}
                              >
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                              </select>
                              {index === dailyAvailability[day.value].length - 1 && (
                                <button type="button" className="add-slot-btn" onClick={() => handleAddTimeSlot(day.value)}>+</button>
                              )}
                              {dailyAvailability[day.value].length > 1 && (
                                <button type="button" className="remove-slot-btn" onClick={() => handleRemoveTimeSlot(day.value, index)}>&times;</button>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="unavailable-text">Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>
          )}

          {/* Block Dates Section */}
          <div className="block-dates-section">
            <h3>Block dates</h3>
            <p>Add dates when you will be unavailable to take calls</p>
            <button type="button" className="add-unavailable-btn" onClick={handleAddBlockedDate}>Add unavailable dates</button>
            <div className="blocked-dates-list">
              {blockedDates.map((date, index) => (
                <div key={index} className="blocked-date-item">
                  <span>{date}</span>
                  <button type="button" onClick={() => handleRemoveBlockedDate(date)}>&times;</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="calendar-content">
          <h3>Calendar View Coming Soon!</h3>
          <p>This section will display your availability in a calendar format.</p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager; 
