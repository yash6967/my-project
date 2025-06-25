import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import './CreateSession.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const CreateSession = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  // State for date selection
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]); // Dates that can be selected

  // State for time selection
  const [selectedTimes, setSelectedTimes] = useState({}); // { date: [{ start, end }] }
  const [showTimeSelection, setShowTimeSelection] = useState(false);

  // State for popup modal
  const [showTimeSlotPopup, setShowTimeSlotPopup] = useState(false);
  const [popupDates, setPopupDates] = useState([]); // Dates to configure in popup
  const [singleDatePopup, setSingleDatePopup] = useState(false); // For single date popup
  const [selectedSingleDate, setSelectedSingleDate] = useState(''); // Single date being configured

  // State for date range filtering
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredDates, setFilteredDates] = useState([]);
  const [expertBookings, setExpertBookings] = useState([]); // For expert bookings

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.userType !== 'domain_expert') {
      navigate('/dashboard');
      return;
    }
    generateAvailableDates();
  }, [user, navigate, currentMonth]);

  const fetchExpertBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${BACKEND_URL}api/slots/bookings-for-expert`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpertBookings(data);
      } else {
        setExpertBookings([]);
      }
    } catch (error) {
      setExpertBookings([]);
    }
  };

  useEffect(() => {
    fetchExpertBookings();
  },[])
   // Generate available dates for the current month (excluding past dates and weekends)
  const generateAvailableDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      // Include future dates and all days of the week (Monday = 1, Sunday = 0)
      if (date >= today) {
        dates.push(new Date(date));
      }
    }
    
    setAvailableDates(dates);
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Date selection handlers
  const handleDateSelect = (date) => {
    // Fix: Use local date formatting instead of toISOString to avoid timezone issues
    const dateString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0');
    
    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(d => d !== dateString);
      } else {
        const newSelectedDates = [...prev, dateString];
        // Show popup for newly selected dates that don't have time slots yet
        const datesWithoutSlots = newSelectedDates.filter(d => !selectedTimes[d] || selectedTimes[d].length === 0);
        if (datesWithoutSlots.length > 0) {
          // setPopupDates(datesWithoutSlots);
          // setShowTimeSlotPopup(true);
        }
        return newSelectedDates;
      }
    });
  };

  const handleSelectAll = () => {
    // Fix: Use local date formatting instead of toISOString
    const allDates = availableDates.map(date => 
      date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0')
    );
    setSelectedDates(allDates);
    // Show popup for all dates that don't have time slots
    const datesWithoutSlots = allDates.filter(d => !selectedTimes[d] || selectedTimes[d].length === 0);
    if (datesWithoutSlots.length > 0) {
      setPopupDates(datesWithoutSlots);
      setShowTimeSlotPopup(true);
    }
  };

  const handleClearAll = () => {
    setSelectedDates([]);
    setSelectedTimes({});
  };

  // Time selection handlers
  const handleTimeChange = (date, index, field, value) => {
    setSelectedTimes(prev => {
      const newTimes = { ...prev };
      if (!newTimes[date]) {
        newTimes[date] = [{ start: '09:00', end: '10:00' }];
      }
      newTimes[date][index][field] = value;
      return newTimes;
    });
  };

  const handleAddTimeSlot = (date) => {
    setSelectedTimes(prev => {
      const newTimes = { ...prev };
      if (!newTimes[date]) {
        newTimes[date] = [];
      }
      newTimes[date] = [...newTimes[date], { start: '09:00', end: '10:00' }];
      return newTimes;
    });
  };

  const handleRemoveTimeSlot = (date, index) => {
    setSelectedTimes(prev => {
      const newTimes = { ...prev };
      newTimes[date] = newTimes[date].filter((_, i) => i !== index);
      if (newTimes[date].length === 0) {
        delete newTimes[date];
      }
      return newTimes;
    });
  };

  // Popup handlers
  const handlePopupTimeChange = (date, index, field, value) => {
    setSelectedTimes(prev => {
      const newTimes = { ...prev };
      if (!newTimes[date]) {
        newTimes[date] = [{ start: '09:00', end: '10:00' }];
      }
      newTimes[date][index][field] = value;
      return newTimes;
    });
  };

  const handlePopupAddTimeSlot = (date) => {
    setSelectedTimes(prev => {
      const newTimes = { ...prev };
      if (!newTimes[date]) {
        newTimes[date] = [];
      }
      newTimes[date] = [...newTimes[date], { start: '09:00', end: '10:00' }];
      return newTimes;
    });
  };

  const handlePopupRemoveTimeSlot = (date, index) => {
    setSelectedTimes(prev => {
      const newTimes = { ...prev };
      newTimes[date] = newTimes[date].filter((_, i) => i !== index);
      if (newTimes[date].length === 0) {
        delete newTimes[date];
      }
      return newTimes;
    });
  };

  const handlePopupSave = () => {
    setShowTimeSlotPopup(false);
    setPopupDates([]);
    toast.success('Time slots configured successfully!');
  };

  const handlePopupCancel = () => {
    setShowTimeSlotPopup(false);
    setPopupDates([]);
  };

  // Handler for opening single date popup
  const handleSingleDateClick = (date) => {
    setSelectedSingleDate(date);
    setSingleDatePopup(true);
  };

  // Handler for closing single date popup
  const handleSingleDatePopupClose = () => {
    setSingleDatePopup(false);
    setSelectedSingleDate('');
  };

  // Handler for saving single date configuration
  const handleSingleDateSave = () => {
    setSingleDatePopup(false);
    setSelectedSingleDate('');
    toast.success('Time slots configured successfully!');
  };

  // Date range filter handlers
  const handleFilterToggle = () => {
    setShowDateFilter(!showDateFilter);
    if (showDateFilter) {
      // Clear filter when closing
      setFilteredDates([]);
      setFilterStartDate('');
      setFilterEndDate('');
    }
  };

  const handleApplyFilter = () => {
    if (!filterStartDate || !filterEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(filterStartDate);
    const end = new Date(filterEndDate);

    if (start > end) {
      toast.error('Start date cannot be after end date');
      return;
    }

    const filtered = selectedDates.filter(date => {
      const dateObj = new Date(date);
      return dateObj >= start && dateObj <= end;
    });

    setFilteredDates(filtered);
    toast.success(`Showing ${filtered.length} dates in selected range`);
  };

  const handleClearFilter = () => {
    setFilteredDates([]);
    setFilterStartDate('');
    setFilterEndDate('');
    toast.info('Date filter cleared');
  };

  // Get dates to display (filtered or all)
  const getDisplayDates = () => {
    return filteredDates.length > 0 ? filteredDates : selectedDates;
  };

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hour = i.toString().padStart(2, '0');
        const minute = j.toString().padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      // Save each selected date with its time slots to the slot API
      const promises = selectedDates.map(async (date) => {
        const timeSlots = selectedTimes[date] || [{ start: '09:00', end: '10:00' }];
        console.log(userId);
        // Transform time slots to match the slot schema format
        const slots = timeSlots.map(slot => ({
          startTime: slot.start,
          endTime: slot.end,
          booked_by: [],
        }));

        const response = await fetch(`${BACKEND_URL}api/slots/date-availability`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            date,
            slots
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to save availability for ${date}`);
        }

        return response.json();
      });

      await Promise.all(promises);
      
      toast.success('Date availability saved successfully!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error saving date availability:', error);
      toast.error(error.message || 'Failed to save date availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get day name
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="create-session-container">
      <div className="session-header">
        <h2>Set Date Availability</h2>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="session-form">
        {/* Date Selection Section */}
        <div className="date-selection-section">
          <div className="section-header">
            <h3>Select Dates</h3>
            <div className="date-actions">
              <button type="button" className="select-all-btn" onClick={handleSelectAll}>
                Select All
              </button>
              <button type="button" className="clear-all-btn" onClick={handleClearAll}>
                Clear All
              </button>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="calendar-header">
            <button type="button" className="nav-btn" onClick={goToPreviousMonth}>
              ←
            </button>
            <h4>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
            <button type="button" className="nav-btn" onClick={goToNextMonth}>
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* <div className="calendar-weekdays">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div> */}
            
            <div className="calendar-days">
              {availableDates.map((date, index) => {
                // Fix: Use local date formatting instead of toISOString for consistency
                const dateString = date.getFullYear() + '-' + 
                                  String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(date.getDate()).padStart(2, '0');
                const isSelected = selectedDates.includes(dateString);
                const hasTimeSlots = selectedTimes[dateString] && selectedTimes[dateString].length > 0;
                
                return (
                  <button
                    key={index}
                    type="button"
                    className={`calendar-day ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateSelect(date)}
                  >
                    <span className="day-number">{date.getDate()}</span>
                    <span className="day-name">{getDayName(date)}</span>
                    {/* {hasTimeSlots && <span className="time-indicator">⏰</span>} */}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDates.length > 0 && (
            <div className="selected-dates-summary">
              <div className="selected-dates-header">
                <h4>Selected Dates ({getDisplayDates().length})</h4>
                <div className="filter-controls">
                  <button 
                    type="button" 
                    className={`filter-toggle-btn ${showDateFilter ? 'active' : ''}`}
                    onClick={handleFilterToggle}
                  >
                    {showDateFilter ? 'Hide Filter' : 'Filter Dates'}
                  </button>
                  {filteredDates.length > 0 && (
                    <button 
                      type="button" 
                      className="clear-filter-btn"
                      onClick={handleClearFilter}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Date Range Filter */}
              {showDateFilter && (
                <div className="date-filter-section">
                  <div className="filter-inputs">
                    <div className="filter-input-group">
                      <label htmlFor="filterStartDate">Start Date:</label>
                      <input
                        type="date"
                        id="filterStartDate"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        min={selectedDates.length > 0 ? Math.min(...selectedDates.map(d => d)) : undefined}
                        max={selectedDates.length > 0 ? Math.max(...selectedDates.map(d => d)) : undefined}
                      />
                    </div>
                    <div className="filter-input-group">
                      <label htmlFor="filterEndDate">End Date:</label>
                      <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        min={filterStartDate || (selectedDates.length > 0 ? Math.min(...selectedDates.map(d => d)) : undefined)}
                        max={selectedDates.length > 0 ? Math.max(...selectedDates.map(d => d)) : undefined}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="apply-filter-btn"
                      onClick={handleApplyFilter}
                      disabled={!filterStartDate || !filterEndDate}
                    >
                      Apply Filter
                    </button>
                  </div>
                  {filteredDates.length > 0 && (
                    <div className="filter-info">
                      <span>Showing {filteredDates.length} of {selectedDates.length} dates</span>
                    </div>
                  )}
                </div>
              )}

              <div className="selected-dates-list">
                {getDisplayDates().map((date, index) => {
                  const hasTimeSlots = selectedTimes[date] && selectedTimes[date].length > 0;
                  return (
                    <span 
                      key={index} 
                      className={`selected-date-tag ${hasTimeSlots ? 'configured' : ''} clickable`}
                      onClick={() => handleSingleDateClick(date)}
                    >
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      {hasTimeSlots && <span className="configured-indicator">✓</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Time Selection Section */}
        {/* {selectedDates.length > 0 && (
          <div className="time-selection-section">
            <h3>Set Time Slots</h3>
            <p>Configure time slots for each selected date</p>
            
            {selectedDates.map((date) => {
              const dateObj = new Date(date);
              const formattedDate = formatDate(dateObj);
              const timeSlots = selectedTimes[date] || [{ start: '09:00', end: '10:00' }];
              
              return (
                <div key={date} className="date-time-group">
                  <div className="date-header">
                    <h4>{formattedDate}</h4>
                    <button 
                      type="button" 
                      className="add-time-btn"
                      onClick={() => handleAddTimeSlot(date)}
                    >
                      + Add Time Slot
                    </button>
                  </div>
                  
                  <div className="time-slots">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="time-slot">
                        <select
                          value={slot.start}
                          onChange={(e) => handleTimeChange(date, index, 'start', e.target.value)}
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="time-separator">to</span>
                        <select
                          value={slot.end}
                          onChange={(e) => handleTimeChange(date, index, 'end', e.target.value)}
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        {timeSlots.length > 1 && (
                          <button 
                            type="button" 
                            className="remove-time-btn"
                            onClick={() => handleRemoveTimeSlot(date, index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )} */}

        {/* Submit Section */}
        <div className="submit-section">
          <button type="submit" className="create-session-btn" disabled={loading}>
            {loading ? 'Saving Availability...' : 'Save Availability'}
          </button>
        </div>
      </form>

      {/* Time Slot Configuration Popup */}
      {showTimeSlotPopup && (
        <div className="modal-overlay">
          <div className="modal-content time-slot-popup">
            <div className="popup-header">
              <h3>Configure Time Slots</h3>
              <p>Set time slots for the selected dates</p>
            </div>
            
            <div className="popup-dates">
              {popupDates.map((date) => {
                const dateObj = new Date(date);
                const formattedDate = formatDate(dateObj);
                const timeSlots = selectedTimes[date] || [{ start: '09:00', end: '10:00' }];
                
                return (
                  <div key={date} className="popup-date-group">
                    <div className="popup-date-header">
                      <h4>{formattedDate}</h4>
                      <button 
                        type="button" 
                        className="add-time-btn"
                        onClick={() => handlePopupAddTimeSlot(date)}
                      >
                        + Add Time Slot
                      </button>
                    </div>
                    
                    <div className="time-slots">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="time-slot">
                          <select
                            value={slot.start}
                            onChange={(e) => handlePopupTimeChange(date, index, 'start', e.target.value)}
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          <span className="time-separator">to</span>
                          <select
                            value={slot.end}
                            onChange={(e) => handlePopupTimeChange(date, index, 'end', e.target.value)}
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          {timeSlots.length > 1 && (
                            <button 
                              type="button" 
                              className="remove-time-btn"
                              onClick={() => handlePopupRemoveTimeSlot(date, index)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="popup-actions">
              <button type="button" className="save-btn" onClick={handlePopupSave}>
                Save Configuration
              </button>
              <button type="button" className="cancel-btn" onClick={handlePopupCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Date Time Slot Configuration Popup */}
      {singleDatePopup && selectedSingleDate && (
        <div className="modal-overlay">
          <div className="modal-content time-slot-popup single-date-popup">
            <div className="popup-header">
              <h3>Configure Time Slots</h3>
              <p>Set time slots for {new Date(selectedSingleDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <div className="popup-dates">
              <div className="popup-date-group">
                <div className="popup-date-header">
                  <h4>{new Date(selectedSingleDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</h4>
                  <button 
                    type="button" 
                    className="add-time-btn"
                    onClick={() => handlePopupAddTimeSlot(selectedSingleDate)}
                  >
                    + Add Time Slot
                  </button>
                </div>
                
                <div className="time-slots">
                  {(selectedTimes[selectedSingleDate] || [{ start: '09:00', end: '10:00' }]).map((slot, index) => (
                    <div key={index} className="time-slot">
                      <select
                        value={slot.start}
                        onChange={(e) => handlePopupTimeChange(selectedSingleDate, index, 'start', e.target.value)}
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <span className="time-separator">to</span>
                      <select
                        value={slot.end}
                        onChange={(e) => handlePopupTimeChange(selectedSingleDate, index, 'end', e.target.value)}
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {(selectedTimes[selectedSingleDate] || []).length > 1 && (
                        <button 
                          type="button" 
                          className="remove-time-btn"
                          onClick={() => handlePopupRemoveTimeSlot(selectedSingleDate, index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="popup-actions">
              <button type="button" className="save-btn" onClick={handleSingleDateSave}>
                Save Configuration
              </button>
              <button type="button" className="cancel-btn" onClick={handleSingleDatePopupClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSession; 
