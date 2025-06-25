import React from 'react';
import { Link } from 'react-router-dom';

const Impact = () => {
  return (
    <div className="impact-buttons">
      <Link to="/impact/events" className="impact-btn">Events</Link>
      <Link to="/impact/domain-experts" className="impact-btn">Experts</Link>
    </div>
  );
};

export default Impact; 
