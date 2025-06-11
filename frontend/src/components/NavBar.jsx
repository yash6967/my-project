import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './NavBar.css';
import { useUser } from '../context/UserContext';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isLoggedIn = !!localStorage.getItem('isLoggedIn');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={aicteLogo} alt="AICTE Logo" className="navbar-logo" />
        <span className="navbar-title">AICTE Jaipur Indovation Center</span>
      </div>
      <div className="navbar-links">
        
        {(
        <Link to="/events" className={`navbar-link${location.pathname === '/events' ? ' active' : ''}`}>Events</Link>
        )}

        
        {(
        <Link to="/service-booking" className={`navbar-link${location.pathname === '/service-booking' ? ' active' : ''}`}>Domain Experts</Link>
        )}
        
        {isLoggedIn && (
          <Link to="/dashboard" className={`navbar-link${location.pathname === '/dashboard' ? ' active' : ''}`}>Dashboard</Link>
        )}
        {(isLoggedIn && (user?.userType === 'admin' || user?.userType === 'super_admin')) ? (
          <Link to="/manage-events" className="navbar-link">Manage Events</Link>
        ) : null}
        {!isLoggedIn ? (
          <Link to="/login" className={`navbar-link${location.pathname === '/login' ? ' active' : ''}`}>Login</Link>
        ) : (
          <button className="navbar-link logout-btn" onClick={handleLogout}>Logout</button>
        )}
        {!isLoggedIn && (
          <Link to="/signup" className={`navbar-link${location.pathname === '/signup' ? ' active' : ''}`}>signup</Link>
        ) }
      </div>
    </nav>
  );
};

export default NavBar;
