import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './ServiceCalendar.css';

const ServiceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    service: '',
    price: '',
    description: ''
  });
  const navigate = useNavigate();

  // Sample services offered by the provider
  const services = [
    'Consultation',
    'Technical Support',
    'Training Session',
    'Project Review',
    'Custom Service'
  ];

  // Sample bookings data
  const sampleBookings = [
    {
      id: 1,
      date: '2024-06-15',
      startTime: '10:00',
      endTime: '11:00',
      service: 'Consultation',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      status: 'confirmed',
      price: 1500
    },
    {
      id: 2,
      date: '2024-06-16',
      startTime: '14:00',
      endTime: '15:30',
      service: 'Training Session',
      clientName: 'Jane Smith',
      clientEmail: 'jane@example.com',
      status: 'pending',
      price: 2500
    }
  ];

  useEffect(() => {
    // Check if user is logged in and is a service provider
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      // Load saved data
      const savedSlots = localStorage.getItem('serviceSlots');
      const savedBookings = localStorage.getItem('serviceBookings');
      
      if (savedSlots) {
        setTimeSlots(JSON.parse(savedSlots));
      }
      
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
      } else {
        setBookings(sampleBookings);
        localStorage.setItem('serviceBookings', JSON.stringify(sampleBookings));
      }
    }
  }, [navigate]);

  // Save slots to localStorage whenever timeSlots changes
  useEffect(() => {
    localStorage.setItem('serviceSlots', JSON.stringify(timeSlots));
  }, [timeSlots]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getSlotsForDate = (date) => {
    const dateStr = formatDate(date);
    return timeSlots.filter(slot => slot.date === dateStr);
  };

  const getBookingsForDate = (date) => {
    const dateStr = formatDate(date);
    return bookings.filter(booking => booking.date === dateStr);
  };

  const isSlotBooked = (slot) => {
    return bookings.some(booking => 
      booking.date === slot.date && 
      booking.startTime === slot.startTime &&
      booking.service === slot.service
    );
  };

  const handleAddSlot = () => {
    if (newSlot.date && newSlot.startTime && newSlot.endTime && newSlot.service && newSlot.price) {
      const slot = {
        id: Date.now(),
        ...newSlot,
        price: parseFloat(newSlot.price)
      };
      
      setTimeSlots([...timeSlots, slot]);
      setNewSlot({
        date: '',
        startTime: '',
        endTime: '',
        service: '',
        price: '',
        description: ''
      });
      setShowAddSlotModal(false);
    }
  };

  const handleDeleteSlot = (slotId) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== slotId));
  };

  const handleBookingAction = (bookingId, action) => {
    setBookings(bookings.map(booking => 
      booking.id === bookingId 
        ? { ...booking, status: action }
        : booking
    ));
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="service-calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <div className="header-left">
            <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
            <h1>Service Provider Calendar</h1>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowAddSlotModal(true)}
              className="add-slot-btn"
            >
              + Add Time Slot
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {/* Calendar Navigation */}
        <div className="calendar-nav">
          <button onClick={() => navigateMonth(-1)} className="nav-btn">
            ← Previous
          </button>
          <h2 className="month-year">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => navigateMonth(1)} className="nav-btn">
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {getDaysInMonth(currentDate).map((day, index) => (
            <div 
              key={index} 
              className={`calendar-day ${day ? 'valid-day' : 'empty-day'} ${
                day && formatDate(day) === formatDate(selectedDate) ? 'selected' : ''
              }`}
              onClick={() => day && setSelectedDate(day)}
            >
              {day && (
                <>
                  <span className="day-number">{day.getDate()}</span>
                  <div className="day-indicators">
                    {getSlotsForDate(day).length > 0 && (
                      <span className="slot-indicator">
                        {getSlotsForDate(day).length} slots
                      </span>
                    )}
                    {getBookingsForDate(day).length > 0 && (
                      <span className="booking-indicator">
                        {getBookingsForDate(day).length} bookings
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Selected Date Details */}
        <div className="date-details">
          <h3>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>

          {/* Available Slots */}
          <div className="slots-section">
            <h4>Available Time Slots</h4>
            <div className="slots-list">
              {getSlotsForDate(selectedDate).length === 0 ? (
                <p className="no-slots">No time slots available for this date.</p>
              ) : (
                getSlotsForDate(selectedDate).map(slot => (
                  <div key={slot.id} className={`slot-card ${isSlotBooked(slot) ? 'booked' : 'available'}`}>
                    <div className="slot-info">
                      <div className="slot-time">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="slot-service">{slot.service}</div>
                      <div className="slot-price">₹{slot.price}</div>
                      {slot.description && (
                        <div className="slot-description">{slot.description}</div>
                      )}
                    </div>
                    <div className="slot-actions">
                      <span className={`slot-status ${isSlotBooked(slot) ? 'booked' : 'available'}`}>
                        {isSlotBooked(slot) ? 'Booked' : 'Available'}
                      </span>
                      {!isSlotBooked(slot) && (
                        <button 
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="delete-slot-btn"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bookings */}
          <div className="bookings-section">
            <h4>Bookings for this Date</h4>
            <div className="bookings-list">
              {getBookingsForDate(selectedDate).length === 0 ? (
                <p className="no-bookings">No bookings for this date.</p>
              ) : (
                getBookingsForDate(selectedDate).map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-info">
                      <div className="booking-time">
                        {booking.startTime} - {booking.endTime}
                      </div>
                      <div className="booking-service">{booking.service}</div>
                      <div className="booking-client">
                        <strong>{booking.clientName}</strong>
                        <span>{booking.clientEmail}</span>
                      </div>
                      <div className="booking-price">₹{booking.price}</div>
                    </div>
                    <div className="booking-actions">
                      <span className={`booking-status ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.status === 'pending' && (
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleBookingAction(booking.id, 'confirmed')}
                            className="confirm-btn"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => handleBookingAction(booking.id, 'rejected')}
                            className="reject-btn"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddSlotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Time Slot</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddSlot(); }}>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time:</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time:</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Service:</label>
                <select
                  value={newSlot.service}
                  onChange={(e) => setNewSlot({...newSlot, service: e.target.value})}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price (₹):</label>
                <input
                  type="number"
                  value={newSlot.price}
                  onChange={(e) => setNewSlot({...newSlot, price: e.target.value})}
                  min="0"
                  step="50"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional):</label>
                <textarea
                  value={newSlot.description}
                  onChange={(e) => setNewSlot({...newSlot, description: e.target.value})}
                  rows="3"
                  placeholder="Additional details about this time slot..."
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Add Slot
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddSlotModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCalendar; 