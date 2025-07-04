import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import elonMuskImage from '../people/elon musk.png';
import narendraModi from '../people/narandra modi.png';
import ganvatsalImage from '../people/ganvatsal.png';
import './ServiceBooking.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const ServiceBooking = () => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    clientName: 'John Doe',
    clientEmail: 'user@example.com',
    notes: ''
  });
  const [myBookings, setMyBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const [filterDate, setFilterDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [expertsWithSlots, setExpertsWithSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const navigate = useNavigate();

  // Sample service providers data as fallback
  const sampleProviders = [
    {
      _id: 1,
      name: 'Elon Musk',
      role: 'Technology Innovation & Entrepreneurship',
      rating: 5.0,
      experience: '25+ years',
      location: 'Austin, Texas, USA',
      image: elonMuskImage,
      services: ['Consultation', 'Technical Support', 'Training Session'],
      hourlyRate: 50000,
      description: 'CEO of Tesla and SpaceX, pioneering electric vehicles, space exploration, and sustainable energy solutions. Expert in disruptive innovation and scaling technology companies.',
      organization: 'Tesla & SpaceX',
      mobileNumber: '+1-555-0123',
      linkedinProfile: 'https://linkedin.com/in/elonmusk'
    },
    {
      _id: 2,
      name: 'Narendra Modi',
      role: 'Leadership & Governance',
      rating: 4.9,
      experience: '20+ years',
      location: 'New Delhi, India',
      image: narendraModi,
      services: ['Project Review', 'Consultation', 'Custom Service'],
      hourlyRate: 25000,
      description: 'Prime Minister of India, leading digital transformation initiatives like Digital India, Make in India, and Startup India. Expert in policy making and national development strategies.',
      organization: 'Government of India',
      mobileNumber: '+91-11-23012345',
      linkedinProfile: 'https://linkedin.com/in/narendramodi'
    },
    {
      _id: 3,
      name: 'Dr. Ganvatsal Swami',
      role: 'Research & Academic Excellence',
      rating: 4.8,
      experience: '15+ years',
      location: 'Mumbai, Maharashtra, India',
      image: ganvatsalImage,
      services: ['Consultation', 'Training Session', 'Project Review'],
      hourlyRate: 15000,
      description: 'Distinguished researcher and academic leader specializing in innovation, technology transfer, and educational excellence. Expert in bridging academia and industry collaboration.',
      organization: 'Academic Institution',
      mobileNumber: '+91-22-12345678',
      linkedinProfile: 'https://linkedin.com/in/ganvatsalswami'
    }
  ];

  useEffect(() => {
    // Check if user is logged in and is a normal user
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    // Fetch all domain experts from the backend
    const fetchDomainExperts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}api/user/domain-experts`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const domainExperts = await response.json();
          // Transform the API response to match our component structure
          const transformedExperts = domainExperts.map(expert => ({
            _id: expert._id,
            name: expert.name,
            role: expert.role || 'Domain Expert',
            rating: 4.5, // Default rating since API doesn't provide it
            experience: '5+ years', // Default experience
            location: expert.locationOfWork || 'India',
            image: expert.photo ? `${BACKEND_URL}profile_photo/${expert.photo}` : elonMuskImage, // Use backend photo or fallback
            services: [expert.Domain || 'Domain Expert'], // Use domain as the service
            hourlyRate: 10000, // Default hourly rate
            description: `Expert in ${expert.Domain || 'domain expertise'} with extensive experience in ${expert.organization || 'various organizations'}.`,
            organization: expert.organization || 'Professional Organization',
            mobileNumber: expert.mobileNumber || 'N/A',
            linkedinProfile: expert.linkedinProfile || '#',
            email: expert.email,
            userType: expert.userType
          }));
          setServiceProviders(transformedExperts);
        } else {
          console.error('Failed to fetch domain experts');
          // Fallback to sample data if API fails
          setServiceProviders(sampleProviders);
        }
      } catch (error) {
        console.error('Error fetching domain experts:', error);
        // Fallback to sample data if API fails
        setServiceProviders(sampleProviders);
      } finally {
        setLoading(false);
      }
    };

    // if (!isLoggedIn) {
    //   navigate('/login');
    // } else 
    {
      fetchDomainExperts();
      
      // Load user's bookings
      const savedBookings = localStorage.getItem('userBookings');
      if (savedBookings) {
        setMyBookings(JSON.parse(savedBookings));
      }
    }
  }, [navigate]);

  // Get unique locations from serviceProviders
  const uniqueLocations = Array.from(new Set(serviceProviders.map(e => e.location))).filter(Boolean);

  useEffect(() => {
    if (!filterDate && !filterLocation) {
      setExpertsWithSlots(serviceProviders);
      return;
    }
    const fetchExpertsWithSlots = async () => {
      const availableExperts = [];
      for (const expert of serviceProviders) {
        // Location filter
        if (filterLocation && expert.location !== filterLocation) continue;
        if (!filterDate) {
          availableExperts.push(expert);
          continue;
        }
        try {
          const response = await fetch(`${BACKEND_URL}api/slots/expert/${expert._id}`);
          if (response.ok) {
            const slotData = await response.json();
            let hasSlot = false;
            if (slotData.dateAvailability) {
              hasSlot = slotData.dateAvailability.some(dateAvail => dateAvail.date === filterDate && dateAvail.isActive && dateAvail.slots && dateAvail.slots.length > 0);
            }
            if (!hasSlot && slotData.dailyAvailability) {
              const dayOfWeek = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
              hasSlot = slotData.dailyAvailability[dayOfWeek] && slotData.dailyAvailability[dayOfWeek].length > 0;
            }
            if (hasSlot) availableExperts.push(expert);
          }
        } catch (e) { /* ignore errors */ }
      }
      setExpertsWithSlots(availableExperts);
    };
    fetchExpertsWithSlots();
  }, [filterDate, filterLocation, serviceProviders]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const loadProviderSlots = async (providerId) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`${BACKEND_URL}api/slots/expert/${providerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const slotData = await response.json();
        console.log('Slot data received:', slotData);
        
        // Transform the slot data to match our component structure
        let transformedSlots = [];
        
        // Process date-specific availability
        if (slotData.dateAvailability && slotData.dateAvailability.length > 0) {
          console.log('Processing date-specific availability:', slotData.dateAvailability);
          slotData.dateAvailability.forEach(dateAvail => {
            if (dateAvail.isActive && dateAvail.slots && dateAvail.slots.length > 0) {
              console.log(`Processing slots for date ${dateAvail.date}:`, dateAvail.slots);
              dateAvail.slots.forEach((slot, index) => {
                transformedSlots.push({
                  id: `${dateAvail.date}-${index}`,
                  providerId: providerId,
                  date: dateAvail.date,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  service: 'Consultation',
                  price: 1000, // Default price - you might want to make this configurable
                  description: 'Expert consultation session',
                  type: 'date-specific',
                  booked_by: slot.booked_by || {}
                });
              });
            }
          });
        }
        
        // Process daily availability for future dates (next 30 days)
        if (slotData.dailyAvailability) {
          console.log('Processing daily availability:', slotData.dailyAvailability);
          const today = new Date();
          for (let i = 0; i < 30; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            // Fix: Use proper weekday format and convert to lowercase
            const dayOfWeek = futureDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const dateString = futureDate.toISOString().split('T')[0];
            
            const dailySlots = slotData.dailyAvailability[dayOfWeek];
            if (dailySlots && dailySlots.length > 0) {
              console.log(`Processing daily slots for ${dayOfWeek} (${dateString}):`, dailySlots);
              dailySlots.forEach((slot, index) => {
                transformedSlots.push({
                  id: `${dateString}-daily-${index}`,
                  providerId: providerId,
                  date: dateString,
                  startTime: slot.start,
                  endTime: slot.end,
                  service: 'Consultation',
                  price: 1000,
                  description: 'Regular consultation session',
                  type: 'daily',
                  booked_by: slot.booked_by || {}
                });
              });
            }
          }
        }
        
        // Filter out blocked dates
        if (slotData.blockedDates && slotData.blockedDates.length > 0) {
          const blockedDateStrings = slotData.blockedDates.map(date => 
            new Date(date).toISOString().split('T')[0]
          );
          transformedSlots = transformedSlots.filter(slot => 
            !blockedDateStrings.includes(slot.date)
          );
        }

        // Filter out slots with dates in the past (only today and future)
        const todayString = new Date().toISOString().split('T')[0];
        transformedSlots = transformedSlots.filter(slot => slot.date >= todayString);

        // Sort slots by date and time
        transformedSlots.sort((a, b) => {
          if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
          }
          return a.startTime.localeCompare(b.startTime);
        });
        
        console.log('Transformed slots:', transformedSlots);
        setAvailableSlots(transformedSlots);
        if (transformedSlots.length > 0) {
          setSelectedDate(transformedSlots[0].date);
          setSelectedTime(null);
        }
      } else {
        console.error('Failed to fetch expert slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching expert slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    loadProviderSlots(provider._id);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    if (selectedSlot && bookingForm.clientName && bookingForm.clientEmail) {
      // Prevent double booking (client-side)
      const alreadyBooked = myBookings.some(b =>
        b.providerId === selectedProvider._id &&
        b.date === selectedSlot.date &&
        b.startTime === selectedSlot.startTime &&
        b.endTime === selectedSlot.endTime
      );
      if (alreadyBooked) {
        alert('You have already booked this slot.');
        return;
      }
      setBookingLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to book a slot.');
          setBookingLoading(false);
          return;
        }
        // Call backend to book the slot
        const response = await fetch(`${BACKEND_URL}api/slots/book`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            expertId: selectedProvider._id,
            date: selectedSlot.date,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            ...(bookingForm.notes ? { message: bookingForm.notes } : {}) // Only include message if provided
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to book slot');
        }
        // Only update local state if booking succeeded
        const newBooking = {
          id: Date.now(),
          ...selectedSlot,
          ...bookingForm,
          providerId: selectedProvider._id,
          providerName: selectedProvider.name,
          status: 'pending',
          bookingDate: new Date().toISOString()
        };
        const updatedBookings = [...myBookings, newBooking];
        setMyBookings(updatedBookings);
        localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
        // Also add to service provider's bookings
        const existingServiceBookings = localStorage.getItem('serviceBookings');
        const serviceBookings = existingServiceBookings ? JSON.parse(existingServiceBookings) : [];
        serviceBookings.push(newBooking);
        localStorage.setItem('serviceBookings', JSON.stringify(serviceBookings));
        setShowBookingModal(false);
        setSelectedSlot(null);
        setBookingForm({
          clientName: 'John Doe',
          clientEmail: 'user@example.com',
          notes: ''
        });
        alert('🎉 Booking request submitted successfully! The service provider will confirm shortly.');
      } catch (err) {
        alert(err.message || 'Failed to book slot. Please try again.');
      } finally {
        setBookingLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'rejected': return '#e51b00';
      default: return '#666';
    }
  };

  // Add categories for filtering
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Consultation', label: 'Consultation' },
    { value: 'Technical Support', label: 'Technical Support' },
    { value: 'Training Session', label: 'Training Session' },
    { value: 'Project Review', label: 'Project Review' },
    { value: 'Custom Service', label: 'Custom Service' }
  ];

  // Filter providers by search and category
  const filteredProviders = serviceProviders.filter(provider => {
    const matchesCategory = selectedCategory === 'all' || provider.services.includes(selectedCategory);
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.organization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper: Get slot status for current user
  const getSlotStatus = (slot) => {
    if (!Array.isArray(slot.booked_by)) return null;
    const userId = localStorage.getItem('userId');
    const booking = slot.booked_by.find(b => b.userId === userId || (b.userId && b.userId.toString() === userId));
    if (!booking) return null;
    if (booking.isAccepted) return 'Accepted';
    if (booking.isRejected) return 'Rejected';
    return 'Pending';
  };

  return (
    <div className="service-booking-container">
      {/* Header */}
      {/* <div className="booking-header">
        <div className="header-content">
          <div className="header-left">
            <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
            <h1>AICTE Domain Experts</h1>
          </div>
          <div className="header-actions">
            
          </div>
        </div>
      </div> */}
      

        {/* Search bar and category filters (copied from Marketplace) */}
        <div className="filters-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search domain experts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.value}
                className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      <div className="booking-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading domain experts...</p>
          </div>
        ) : !selectedProvider ? (
          /* Service Providers List */
          <div className="providers-section">
            {/* <h2>Available Domain Experts</h2> */}
            <div className="provider-date-filter">
              <label>Show experts available on: </label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              {filterDate && <button onClick={() => setFilterDate('')}>Clear</button>}
              <label style={{marginLeft: '18px'}}>Location:</label>
              <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                <option value="">All</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              {filterLocation && <button onClick={() => setFilterLocation('')}>Clear</button>}
            </div>
            <div className="providers-grid">
              {expertsWithSlots.map(provider => (
                <div key={provider._id} className="provider-card">
                  <div className="provider-image">
                    <img src={provider.image} alt={provider.name} />
                    <div className="rating-badge">
                      ⭐ {provider.rating}
                    </div>
                  </div>
                  
                  <div className="provider-info">
                    <h3>{provider.name}</h3>
                    <p className="specialization">{provider.domain}</p>
                    <p className="experience">{provider.experience} experience</p>
                    <p className="location">📍 {provider.location}</p>
                    <p className="organization">🏢 {provider.organization}</p>
                    <p className="description">{provider.description}</p>
                    {provider.linkedinProfile && provider.linkedinProfile !== '#' && (
                        <p>
                          <strong>LinkedIn:</strong> 
                          <a href={provider.linkedinProfile} target="_blank" rel="noopener noreferrer" className="linkedin-profile-link">
                            View Profile
                          </a>
                        </p>
                      )}
                    <div className="services-list">
                      <h4>Services:</h4>
                      <div className="service-tags">
                        {provider.services.map(service => (
                          <span key={service} className="service-tag">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="provider-footer">
                      {/* <div className="hourly-rate">
                        ₹{provider.hourlyRate}/hour
                      </div> */}
                      <button 
                        onClick={() => handleProviderSelect(provider)}
                        className="select-provider-btn"
                      >
                        View Slots
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Selected Provider Slots */
          <div className="slots-section">
            <div className="provider-header">
              <button 
                onClick={() => setSelectedProvider(null)}
                className="back-btn"
              >
                ← Back to Providers
              </button>
              <div className="selected-provider-info">
                <img src={selectedProvider.image} alt={selectedProvider.name} />
                <div>
                  <h2>{selectedProvider.name}</h2>
                  <p>{selectedProvider.domain}</p>
                  <p className="provider-organization">{selectedProvider.organization}</p>
                </div>
              </div>
            </div>

            <h3>Available Time Slots</h3>
            {loadingSlots ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading available slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="no-slots">
                <p>No available slots for this provider at the moment.</p>
                <p>Please check back later or contact the provider directly.</p>
                <div className="provider-contact">
                  <p><strong>Contact Information:</strong></p>
                  <p>📧 Email: {selectedProvider.email}</p>
                  <p>📱 Phone: {selectedProvider.mobileNumber}</p>
                  {selectedProvider.linkedinProfile && (
                    <p>💼 LinkedIn: <a href={selectedProvider.linkedinProfile} target="_blank" rel="noopener noreferrer">View Profile</a></p>
                  )}
                </div>
              </div>
            ) : (
              // New UI for slots selection
              <div className="slot-booking-ui">
                {/* Group slots by date */}
                {(() => {
                  // Group slots by date
                  const slotsByDate = {};
                  availableSlots.forEach(slot => {
                    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
                    slotsByDate[slot.date].push(slot);
                  });
                  const dateKeys = Object.keys(slotsByDate).sort();
                  // Timezone options (can be expanded)
                  const timezoneOptions = [
                    { value: 'Asia/Kolkata', label: '(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi (IST)' },
                    { value: 'UTC', label: '(GMT+0:00) UTC' },
                    { value: 'America/New_York', label: '(GMT-4:00) New York (EDT)' },
                    { value: 'Europe/London', label: '(GMT+1:00) London (BST)' },
                  ];
                  // Confirm handler
                  const handleConfirm = () => {
                    if (!selectedDate || !selectedTime) {
                      alert('Please select a date and time slot.');
                      return;
                    }
                    // Find the slot object
                    const slot = slotsByDate[selectedDate].find(s => s.startTime === selectedTime);
                    handleSlotSelect(slot);
                  };
                  return (
                    <div className="slot-booking-card">
                      <div className="date-scroll-row">
                        <button className="scroll-arrow" onClick={e => {e.preventDefault(); document.getElementById('date-scroll').scrollLeft -= 200;}}>&lt;</button>
                        <div className="date-list" id="date-scroll">
                          {dateKeys.map(date => (
                            <button
                              key={date}
                              className={`date-btn${selectedDate === date ? ' selected' : ''}`}
                              onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                            >
                              <div className="date-day">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="date-num">{new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</div>
                            </button>
                          ))}
                        </div>
                        <button className="scroll-arrow" onClick={e => {e.preventDefault(); document.getElementById('date-scroll').scrollLeft += 200;}}>&gt;</button>
                      </div>
                      <div className="time-slot-row">
                        {slotsByDate[selectedDate].map(slot => {
                          const status = getSlotStatus(slot);
                          // Determine if slot is available for booking
                          const available = !Array.isArray(slot.booked_by) || slot.booked_by.length === 0
                            ? true
                            : !slot.booked_by.some(b => b.isAccepted === true);

                          return (
                            <button
                              key={slot.startTime}
                              className={`time-btn${selectedTime === slot.startTime ? ' selected' : ''}${!available ? ' disabled' : ''}`}
                              onClick={() => available && setSelectedTime(slot.startTime)}
                              disabled={!available}
                            >
                              {slot.startTime} - {slot.endTime}
                              {status && (
                                <span
                                  className={`slot-status slot-status-${status.toLowerCase()}`}
                                  style={{
                                    marginLeft: 8,
                                    color: status === 'Accepted' ? 'green' : status === 'Rejected' ? 'red' : 'orange',
                                    fontWeight: 600
                                  }}
                                >
                                  {status}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="timezone-section">
                        <label>Timezone</label>
                        <select
                          value={selectedTimezone}
                          onChange={e => setSelectedTimezone(e.target.value)}
                        >
                          {timezoneOptions.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                      <button className="confirm-details-btn" onClick={handleConfirm}>
                        Confirm Details
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Booking</h3>
            
            <div className="booking-summary">
              <h4>Booking Details</h4>
              <div className="summary-item">
                <span>Provider:</span>
                <span>{selectedProvider.name}</span>
              </div>
              <div className="summary-item">
                <span>Service:</span>
                <span>{selectedSlot.service}</span>
              </div>
              <div className="summary-item">
                <span>Date:</span>
                <span>{formatDate(selectedSlot.date)}</span>
              </div>
              <div className="summary-item">
                <span>Time:</span>
                <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
              </div>
              {/* <div className="summary-item">
                <span>Price:</span>
                <span>₹{selectedSlot.price}</span>
              </div> */}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleBookingSubmit(); }}>
              {/* <div className="form-group">
                <label>Your Name:</label>
                <input
                  type="text"
                  value={bookingForm.clientName}
                  onChange={(e) => setBookingForm({...bookingForm, clientName: e.target.value})}
                  required
                />
              </div> */}

              {/* <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={bookingForm.clientEmail}
                  onChange={(e) => setBookingForm({...bookingForm, clientEmail: e.target.value})}
                  required
                />
              </div> */}

              {/* <div className="form-group">
                <label>Additional Notes (Optional):</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                  rows="3"
                  placeholder="Any specific requirements or questions..."
                />
              </div> */}

              <div className="modal-actions">
                <button type="submit" className="confirm-booking-btn" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowBookingModal(false); setSelectedSlot(null); setBookingForm({ clientName: 'John Doe', clientEmail: 'user@example.com', notes: '' }); }}
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

export default ServiceBooking;
