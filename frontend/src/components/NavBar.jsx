import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import aicteLogo from '../assets/aicte_logo.png';
import './NavBar.css';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDetails, setEditDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    address: user?.address || '',
    gender: user?.gender || '',
    organization: user?.organization || '',
    role: user?.role || '',
    locationOfWork: user?.locationOfWork || '',
    dateOfBirth: user?.dateOfBirth || '',
    linkedinProfile: user?.linkedinProfile || '',
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const openEditModal = () => {
    setEditDetails({
      name: user?.name || '',
      email: user?.email || '',
      mobileNumber: user?.mobileNumber || '',
      address: user?.address || '',
      gender: user?.gender || '',
      organization: user?.organization || '',
      role: user?.role || '',
      locationOfWork: user?.locationOfWork || '',
      dateOfBirth: user?.dateOfBirth || '',
      linkedinProfile: user?.linkedinProfile || '',
    });
    setIsEditModalOpen(true);
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditDetails((prev) => ({ ...prev, [name]: value }));
  };
  
  const saveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      // Update backend with new user details
      const response = await fetch(`${BACKEND_URL}api/auth/user-details/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editDetails)
      });

      if (response.ok) {
        // Update global context
        setUser(editDetails);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(editDetails));
        
        // Close modal
        setIsEditModalOpen(false);
        
        toast.success('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    }
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const isLoggedIn = !!localStorage.getItem('isLoggedIn');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={aicteLogo} alt="AICTE Logo" className="navbar-logo" />
        <span className="navbar-title">AICTE Jaipur Indovation Center</span>
      </div>
      <button className="navbar-toggle" onClick={() => setMenuOpen(m => !m)}>
        <FaBars size={22} />
      </button>
      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        <Link to="/events" className={`navbar-link${location.pathname === '/events' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Events</Link>
        <Link to="/impact" className={`navbar-link${location.pathname === '/impact' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Impact</Link>
        <Link to="/service-booking" className={`navbar-link${location.pathname === '/service-booking' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Domain Experts</Link>
        {isLoggedIn && (
          <Link to="/dashboard" className={`navbar-link${location.pathname === '/dashboard' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Dashboard</Link>
        )}
        {(isLoggedIn && (user?.userType === 'admin' || user?.userType === 'super_admin')) && (
          <Link to="/manage-events" className="navbar-link" onClick={() => setMenuOpen(false)}>Manage Events</Link>
        )}
        {!isLoggedIn ? (
          <Link to="/login" className={`navbar-link${location.pathname === '/login' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Login</Link>
        ) : (
          <button className="navbar-link logout-btn" onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</button>
        )}
        {!isLoggedIn && (
          <Link to="/signup" className={`navbar-link${location.pathname === '/signup' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Signup</Link>
        )}
        {isLoggedIn && (
          <div className="profile-icon" onClick={() => { setMenuOpen(false); handleProfileClick(); }}>👤</div>
        )}
      </div>

      {/* Edit Modal - keeping this for now in case it's needed elsewhere */}
      {isEditModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit User Details</h3>
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={editDetails.name || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={editDetails.email || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Mobile Number:
              <input
                type="text"
                name="mobileNumber"
                value={editDetails.mobileNumber || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Address:
              <input
                type="text"
                name="address"
                value={editDetails.address || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Gender:
              <input
                type="text"
                name="gender"
                value={editDetails.gender || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Organization:
              <input
                type="text"
                name="organization"
                value={editDetails.organization || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Role:
              <input
                type="text"
                name="role"
                value={editDetails.role || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Location of Work:
              <input
                type="text"
                name="locationOfWork"
                value={editDetails.locationOfWork || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Date of Birth:
              <input
                type="date"
                name="dateOfBirth"
                value={editDetails.dateOfBirth ? new Date(editDetails.dateOfBirth).toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              LinkedIn Profile:
              <input
                type="url"
                name="linkedinProfile"
                value={editDetails.linkedinProfile || ''}
                onChange={handleInputChange}
              />
            </label>
            <button onClick={saveChanges}>Save</button>
            <button onClick={closeEditModal}>Cancel</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
