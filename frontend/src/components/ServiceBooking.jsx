import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import elonMuskImage from '../people/elon musk.png';
import narendraModi from '../people/narandra modi.png';
import ganvatsalImage from '../people/ganvatsal.png';
import './ServiceBooking.css';

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
  const navigate = useNavigate();

  // Sample service providers data
  const sampleProviders = [
    {
      id: 1,
      name: 'Elon Musk',
      specialization: 'Technology Indovation & Entrepreneurship',
      rating: 5.0,
      experience: '25+ years',
      location: 'Austin, Texas, USA',
      image: elonMuskImage,
      services: ['Consultation', 'Technical Support', 'Training Session'],
      hourlyRate: 50000,
      description: 'CEO of Tesla and SpaceX, pioneering electric vehicles, space exploration, and sustainable energy solutions. Expert in disruptive indovation and scaling technology companies.'
    },
    {
      id: 2,
      name: 'Narendra Modi',
      specialization: 'Leadership & Governance',
      rating: 4.9,
      experience: '20+ years',
      location: 'New Delhi, India',
      image: narendraModi,
      services: ['Project Review', 'Consultation', 'Custom Service'],
      hourlyRate: 25000,
      description: 'Prime Minister of India, leading digital transformation initiatives like Digital India, Make in India, and Startup India. Expert in policy making and national development strategies.'
    },
    {
      id: 3,
      name: 'Dr. Ganvatsal Swami',
      specialization: 'Research & Academic Excellence',
      rating: 4.8,
      experience: '15+ years',
      location: 'Mumbai, Maharashtra, India',
      image: ganvatsalImage,
      services: ['Consultation', 'Training Session', 'Project Review'],
      hourlyRate: 15000,
      description: 'Distinguished researcher and academic leader specializing in indovation, technology transfer, and educational excellence. Expert in bridging academia and industry collaboration.'
    }
  ];

  useEffect(() => {
    // Check if user is logged in and is a normal user
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    
    // if (!isLoggedIn) {
    //   navigate('/login');
    // } else 
    {
      setServiceProviders(sampleProviders);
      
      // Load user's bookings
      const savedBookings = localStorage.getItem('userBookings');
      if (savedBookings) {
        setMyBookings(JSON.parse(savedBookings));
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const loadProviderSlots = (providerId) => {
    // In a real app, this would fetch from an API
    // For demo, we'll use localStorage data from service providers
    const savedSlots = localStorage.getItem('serviceSlots');
    if (savedSlots) {
      const allSlots = JSON.parse(savedSlots);
      // Filter slots for the selected provider and future dates only
      const today = new Date().toISOString().split('T')[0];
      const providerSlots = allSlots.filter(slot => 
        slot.providerId === providerId && slot.date >= today
      );
      setAvailableSlots(providerSlots);
    } else {
      // Sample slots for demo
      const sampleSlots = [
        {
          id: 1,
          providerId: providerId,
          date: '2024-06-15',
          startTime: '10:00',
          endTime: '11:00',
          service: 'Consultation',
          price: 1500,
          description: 'One-on-one consultation session'
        },
        {
          id: 2,
          providerId: providerId,
          date: '2024-06-15',
          startTime: '14:00',
          endTime: '15:30',
          service: 'Training Session',
          price: 2500,
          description: 'Comprehensive training on latest technologies'
        },
        {
          id: 3,
          providerId: providerId,
          date: '2024-06-16',
          startTime: '09:00',
          endTime: '10:00',
          service: 'Technical Support',
          price: 1200,
          description: 'Technical troubleshooting and support'
        }
      ];
      setAvailableSlots(sampleSlots);
    }
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    loadProviderSlots(provider.id);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = () => {
    if (selectedSlot && bookingForm.clientName && bookingForm.clientEmail) {
      const newBooking = {
        id: Date.now(),
        ...selectedSlot,
        ...bookingForm,
        providerId: selectedProvider.id,
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
      provider.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        {!selectedProvider ? (
          /* Service Providers List */
          <div className="providers-section">
            {/* <h2>Available Domain Experts</h2> */}
            <div className="providers-grid">
              {filteredProviders.map(provider => (
                <div key={provider.id} className="provider-card">
                  <div className="provider-image">
                    <img src={provider.image} alt={provider.name} />
                    <div className="rating-badge">
                      ⭐ {provider.rating}
                    </div>
                  </div>
                  
                  <div className="provider-info">
                    <h3>{provider.name}</h3>
                    <p className="specialization">{provider.specialization}</p>
                    <p className="experience">{provider.experience} experience</p>
                    <p className="location">📍 {provider.location}</p>
                    <p className="description">{provider.description}</p>
                    
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
                      <div className="hourly-rate">
                        ₹{provider.hourlyRate}/hour
                      </div>
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
                  <p>{selectedProvider.specialization}</p>
                </div>
              </div>
            </div>

            <h3>Available Time Slots</h3>
            {availableSlots.length === 0 ? (
              <div className="no-slots">
                <p>No available slots for this provider at the moment.</p>
                <p>Please check back later or contact the provider directly.</p>
              </div>
            ) : (
              <div className="slots-grid">
                {availableSlots.map(slot => (
                  <div key={slot.id} className="slot-card">
                    <div className="slot-date">
                      {formatDate(slot.date)}
                    </div>
                    <div className="slot-time">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="slot-service">
                      {slot.service}
                    </div>
                    {slot.description && (
                      <div className="slot-description">
                        {slot.description}
                      </div>
                    )}
                    <div className="slot-footer">
                      <div className="slot-price">
                        ₹{slot.price}
                      </div>
                      <button 
                        onClick={() => handleSlotSelect(slot)}
                        className="book-slot-btn"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
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
              <div className="summary-item">
                <span>Price:</span>
                <span>₹{selectedSlot.price}</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleBookingSubmit(); }}>
              <div className="form-group">
                <label>Your Name:</label>
                <input
                  type="text"
                  value={bookingForm.clientName}
                  onChange={(e) => setBookingForm({...bookingForm, clientName: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={bookingForm.clientEmail}
                  onChange={(e) => setBookingForm({...bookingForm, clientEmail: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Additional Notes (Optional):</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                  rows="3"
                  placeholder="Any specific requirements or questions..."
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="confirm-booking-btn">
                  Confirm Booking
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowBookingModal(false)}
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