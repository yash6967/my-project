import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import event1Image from '../images/event1.png';
import event2Image from '../images/event2.png';
import event3Image from '../images/event3.png';
import event1 from '../images/event1.png';
import event2 from '../images/event2.png';
import event3 from '../images/event3.png';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import event4image from '../../../backend/images/'
import './Marketplace.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const Marketplace = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
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
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Error fetching events:', error);
        setEvents(sampleEvents); // Fallback to sample events on error
      }
    };

    fetchEvents();
    
    // if (!isLoggedIn) {
    //   navigate('/login');
    // }  else 
    {
      // setEvents(sampleEvents);
      // Load registrations from localStorage
      const savedRegistrations = localStorage.getItem('events');
      if (savedRegistrations) {
        try {
          const parsedRegistrations = JSON.parse(savedRegistrations);
          if (Array.isArray(parsedRegistrations) && parsedRegistrations.every(item => typeof item === 'string')) {
            setRegistrations(parsedRegistrations);
          } else {
            console.error('Invalid data format for saved registrations. Expected an array of strings.');
            toast.error('Invalid data format for saved registrations. Expected an array of strings.');
          }
        } catch (error) {
          console.error('Error parsing saved registrations:', error);
          toast.error('Error parsing saved registrations:', error);
        }
      }
    }
  }, [navigate]);

  // Save registrations to localStorage whenever registrations change
  // useEffect(() => {
  //   localStorage.setItem('events', JSON.stringify(registrations));
  // }, [registrations]);

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const handleScreenClick = (e) => {
    if (isFilterVisible) {
      setIsFilterVisible(false);
    }
  };

  const registerForEvent = async (props) => {
    console.log("event object here : ",props.event);
    console.log("event object here : ",props.event._id);
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      toast.error("please log in first");
      navigate('/login');
      return;
    }

    if (props.event.availableSeats <= 0) {
      // alert('Sorry, this event is full!');
      toast.error('Sorry, this event is full!');
      return;
    }

    try {
      // First request: Register the user for the event
      const registerEventResponse = await fetch(`${BACKEND_URL}api/events/${props.event._id}/register`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId: localStorage.getItem('userId') }),
      });

      if (!registerEventResponse.ok) {
        throw new Error('Failed to register for the event');
      }
      // Add the event ID to the registrations state and localStorage
      setRegistrations((prevRegistrations) => {
        const updatedRegistrations = [...prevRegistrations, props.event._id];
        localStorage.setItem('events', JSON.stringify(updatedRegistrations));
        return updatedRegistrations;
      });

      // Second request: Update the user's events in the backend
      const updateUserResponse = await fetch(`${BACKEND_URL}api/user/event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ eventId: props.event._id}),
      });

      if (!updateUserResponse.ok) {
        throw new Error('Failed to update user events');
      }

      // alert(`Successfully registered for "${props.event.title}"!`);
      toast.success(`Successfully registered for "${props.event.title}"!`);
    } catch (error) {
      console.error('Error registering for event:', error);
      // alert('An error occurred while registering for the event. Please try again.');
      toast.error('An error occurred while registering for the event. Please try again.');
    }
  };

  const cancelRegistration = async (eventId) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/events/${eventId}/cancel-register`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: localStorage.getItem('userId') }),
      });

      if (response.ok) {
        toast.success('Registration canceled successfully!');
        // Optionally, refresh the events or registrations list
        setRegistrations(registrations.filter((reg) => reg !== eventId));
      } else {
        const errorText = await response.text();
        console.error('Error canceling registration:', errorText);
        toast.error('Failed to cancel registration.');
      }
    } catch (error) {
      console.error('Error canceling registration:', error);
      toast.error('An error occurred while canceling registration.');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'registered') {
      return registrations.includes(event._id) && matchesCategory && matchesSearch;
    } else if (filter === 'not_registered') {
      return !registrations.includes(event._id) && matchesCategory && matchesSearch;
    }
    return matchesCategory && matchesSearch; // 'all' filter
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
    <div className="marketplace-container" onClick={handleScreenClick}>
      <div className="hero-section">
        <button className="arrow-button" onClick={handlePreviousEvent}>❮</button>
        <img src={eventImages[currentEventIndex]} alt="Ongoing Event" className="hero-image" />
        <button className="arrow-button" onClick={handleNextEvent}>❯</button>
      </div>
      <div className="filter-icon" onClick={(e) => { e.stopPropagation(); toggleFilterVisibility(); }}>
        <span>☰</span>
      </div>
      {isFilterVisible && (
        <div className="filter-buttons" onClick={(e) => e.stopPropagation()}>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'registered' ? 'active' : ''}`}
            onClick={() => setFilter('registered')}
          >
            Registered
          </button>
          <button
            className={`filter-btn ${filter === 'not_registered' ? 'active' : ''}`}
            onClick={() => setFilter('not_registered')}
          >
            Not Registered
          </button>
        </div>
      )}
      <div className="filters-section">
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
        <div className="events-grid">
          {filteredEvents.map(event => (
            <div key={event._id} className="event-card">
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
                    className={`register-button ${registrations.find(reg => reg === event._id) ? 'registered' : ''}`}
                    onClick={() => {
                      registerForEvent({ event });
                      setEvents((prevEvents) =>
                        prevEvents.map((e) =>
                          e._id === event._id
                            ? { ...e, availableSeats: e.availableSeats - 1 }
                            : e
                        )
                      );
                    }}
                    disabled={event.availableSeats === 0 || registrations.find(reg => reg === event._id)}
                  >
                    {registrations.find(reg => reg === event._id) 
                      ? 'Registered ✓' 
                      : event.availableSeats === 0 
                      ? 'Event Full' 
                      : 'Register'
                    }
                  </button>
                  {registrations.some((reg) => reg === event._id) && (
                    <button 
                      onClick={() => {
                        cancelRegistration(event._id);
                        setEvents((prevEvents) =>
                          prevEvents.map((e) =>
                            e._id === event._id
                              ? { ...e, availableSeats: e.availableSeats + 1 }
                              : e
                          )
                        );
                      }} 
                      className="cancel-registration-btn"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
