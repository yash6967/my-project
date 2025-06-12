import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import event1Image from '../images/event1.png';
import event2Image from '../images/event2.png';
import event3Image from '../images/event3.png';
import event1 from '../images/event1.png';
import event2 from '../images/event2.png';
import event3 from '../images/event3.png';
// import event4image from '../../../backend/images/'
import './Marketplace.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const Marketplace = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const eventImages = [event1, event2, event3];
  // AICTE Events data
  const sampleEvents = [
    {
      id: 1,
      title: "AICTE Idea Lab Tech Fest 2025",
      description: "A cutting-edge event showcasing indovations and creative technological solutions from students, featuring workshops, seminars, and competitions led by industry experts and academic leaders.",
      date: "2025-03-15",
      time: "10:00 AM",
      endTime: "5:00 PM",
      location: "AICTE Indovation Hub, New Delhi",
      category: "ip_consultancy",
      image: event1Image,
      availableSeats: 200,
      organizer: "AICTE Indovation Cell"
    },
    {
      id: 2,
      title: "Smart India Hackathon (SIH) 2025",
      description: "A national-level coding competition where students collaborate to solve real-world problems posed by government and industry, with mentoring from top tech experts.",
      date: "2025-04-10",
      time: "09:00 AM",
      endTime: "6:00 PM",
      location: "AICTE National Center, Mumbai",
      category: "expert_guidance",
      image: event2Image,
      availableSeats: 500,
      organizer: "AICTE & Ministry of Education"
    },
    {
      id: 3,
      title: "JIC Indovation Summit 2025",
      description: "A gathering of innovators, entrepreneurs, and educators to share disruptive ideas and the latest trends in technology, featuring talks, panel discussions, and startup showcases.",
      date: "2025-01-25",
      time: "10:00 AM",
      endTime: "4:00 PM",
      location: "JIC Convention Center, Bangalore",
      category: "mentoring",
      image: event3Image,
      availableSeats: 300,
      organizer: "JIC Indovation Hub"
    },
    
  ];

  useEffect(() => {
    // Check if user is logged in and is a normal user
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    // Fetch events from the backend
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}api/events/`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        // Combine sample events with fetched events
        setEvents([...sampleEvents, ...data]);
        console.log(sampleEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents(sampleEvents); // Fallback to sample events on error
      }
    };

    fetchEvents();
    
    // if (!isLoggedIn) {
    //   navigate('/login');
    // }  else 
    {
      setEvents(sampleEvents);
      // Load registrations from localStorage
      const savedRegistrations = localStorage.getItem('eventRegistrations');
      if (savedRegistrations) {
        setRegistrations(JSON.parse(savedRegistrations));
      }
    }
  }, [navigate]);

  // Save registrations to localStorage whenever registrations change
  useEffect(() => {
    localStorage.setItem('eventRegistrations', JSON.stringify(registrations));
  }, [registrations]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');

    localStorage.removeItem('eventRegistrations');
    navigate('/login');
  };

  const registerForEvent = (event) => {
    const existingRegistration = registrations.find(reg => reg.id === event.id);
    if (existingRegistration) {
      alert('You are already registered for this event!');
      return;
    }
    
    if (event.availableSeats <= 0) {
      alert('Sorry, this event is full!');
      return;
    }

    const registration = {
      ...event,
      registrationDate: new Date().toISOString(),
      status: 'registered'
    };
    
    setRegistrations([...registrations, registration]);
    
    // Update available seats
    setEvents(events.map(e => 
      e.id === event.id 
        ? { ...e, availableSeats: e.availableSeats - 1 }
        : e
    ));
    
    alert(`Successfully registered for "${event.title}"!`);
  };

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'ip_consultancy', label: 'IP Consultancy' },
    { value: 'company_registration', label: 'Company Registration' },
    { value: 'mentoring', label: 'Mentoring' },
    { value: 'expert_guidance', label: 'Expert Guidance' }
  ];

  const formatCategoryName = (category) => {
    const categoryMap = {
      'ip_consultancy': 'IP Consultancy',
      'company_registration': 'Company Registration',
      'mentoring': 'Mentoring',
      'expert_guidance': 'Expert Guidance'
    };
    return categoryMap[category] || category;
  };
  const handleNextEvent = () => {
    setCurrentEventIndex((prevIndex) => (prevIndex + 1) % eventImages.length);
  };

  const handlePreviousEvent = () => {
    setCurrentEventIndex((prevIndex) => (prevIndex - 1 + eventImages.length) % eventImages.length);
  };
  return (
    <div className="marketplace-container">
      <div className="hero-section">
        <button className="arrow-button" onClick={handlePreviousEvent}>❮</button>
        <img src={eventImages[currentEventIndex]} alt="Ongoing Event" className="hero-image" />
        <button className="arrow-button" onClick={handleNextEvent}>❯</button>
      </div>
      <div className="filters-section">
        {/* <div className='marketplace-section'>
          <h2>Events </h2>
        </div> */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search events..."
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
      <div className="market-content">
      {/* Header */}
      {/* <div className="marketplace-header">
        <div className="header-content">
          <div className="header-left">
            <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
            <h1>AICTE Events</h1>
            <br />
            <h2>Welcome, {localStorage.getItem('userName')}</h2>
          </div>
          <div className="header-actions">
            
            
          </div>
        </div>
      </div> */}

      {/* Filters */}
      

      {/* Events Grid */}
        
      <div className="events-grid">
        {filteredEvents.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-image">
              <img src={event.image} alt={event.title} />
              <div className="event-category">{formatCategoryName(event.category)}</div>
            </div>
            <div className="event-content">
              <h3 className="event-title">{event.title}</h3>
              <p className="event-description">{event.description}</p>
              <div className="event-details">
                <div className="event-date">
                  <span className="icon">📅</span>
                  {new Date(event.date).toLocaleDateString()} 
                  {event.endTime ? ` | ${event.time} - ${event.endTime}` : ` at ${event.time}`}
                </div>
                <div className="event-location">
                  <span className="icon">📍</span>
                  {event.location}
                </div>
                <div className="event-organizer">
                  <span className="icon">👥</span>
                  {event.organizer}
                </div>
              </div>
              <div className="event-footer">
                <div className="seats-section">
                  <span className="available">
                    {event.availableSeats} seats available
                  </span>
                </div>
                <button 
                  className={`register-button ${registrations.find(reg => reg.id === event.id) ? 'registered' : ''}`}
                  onClick={() => registerForEvent(event)}
                  disabled={event.availableSeats === 0 || registrations.find(reg => reg.id === event.id)}
                >
                  {registrations.find(reg => reg.id === event.id) 
                    ? 'Registered ✓' 
                    : event.availableSeats === 0 
                    ? 'Event Full' 
                    : 'Register'
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Registrations Sidebar - Only show if user has registrations */}
      {registrations.length > 0 && (
        <div className="registrations-sidebar">
          <h3>My Registrations</h3>
          <div className="registration-items">
            {registrations.map(registration => (
              <div key={registration.id} className="registration-item">
                <div className="registration-info">
                  <h4>{registration.title}</h4>
                  <p>{new Date(registration.date).toLocaleDateString()}</p>
                  <span className="status">✓ Registered</span>
                </div>
              </div>
            ))}
          </div>
          <div className="total-registrations">
            <strong>Total Events: {registrations.length}</strong>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Marketplace; 
