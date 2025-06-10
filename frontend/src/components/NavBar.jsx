import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isLoggedIn = !!localStorage.getItem('isLoggedIn');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={aicteLogo} alt="AICTE Logo" className="navbar-logo" />
        <span className="navbar-title">Jaipur Indovation Center</span>
      </div>
      <div className="navbar-links">
        <Link to="/marketplace" className="navbar-link">Events</Link>
        <Link to="/service-booking" className="navbar-link">Domain Experts</Link>
        {isLoggedIn && (
          <Link to="/dashboard" className="navbar-link">Dashboard</Link>
        )}
        {!isLoggedIn ? (
          <Link to="/login" className="navbar-link">Login</Link>
        ) : (
          <button className="navbar-link logout-btn" onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;