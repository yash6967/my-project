import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Impact.css';

const Impact = () => {
  const navigate = useNavigate();

  const handleEventsClick = () => {
    navigate('/impact/events-stats');
  };

  const handleExpertsClick = () => {
    navigate('/DomainExpertStats');
  };

  return (
    <div className="impact-container">
      <div className="impact-header">
        <h1>Impact</h1>
        <p>Choose what you'd like to explore</p>
      </div>
      
      <div className="impact-content">
        <div className="impact-buttons">
          <button 
            className="impact-btn events-btn" 
            onClick={handleEventsClick}
          >
            <div className="btn-icon">📅</div>
            <div className="btn-content">
              <h3>Events</h3>
              <p>Discover and register for upcoming events</p>
            </div>
          </button>
          
          <button 
            className="impact-btn experts-btn" 
            onClick={handleExpertsClick}
          >
            <div className="btn-icon">👨‍💼</div>
            <div className="btn-content">
              <h3>Experts</h3>
              <p>Connect with domain experts and book sessions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Impact; 
