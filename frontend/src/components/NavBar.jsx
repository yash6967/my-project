import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './NavBar.css';
import { useUser } from '../context/UserContext';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);
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
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
    setIsEditModalOpen(true);
  };
    setEditDetails((prev) => ({ ...prev, [name]: value }));
  };
  
    console.log("Saved details:", editDetails);
  
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
      <div className="navbar-links">
        <Link to="/events" className={`navbar-link${location.pathname === '/events' ? ' active' : ''}`}>Events</Link>
        <Link to="/service-booking" className={`navbar-link${location.pathname === '/service-booking' ? ' active' : ''}`}>Domain Experts</Link>
        {isLoggedIn && (
          <Link to="/dashboard" className={`navbar-link${location.pathname === '/dashboard' ? ' active' : ''}`}>Dashboard</Link>
        )}
        {(isLoggedIn && (user?.userType === 'admin' || user?.userType === 'super_admin')) && (
          <Link to="/manage-events" className="navbar-link">Manage Events</Link>
        )}
        {!isLoggedIn ? (
          <Link to="/login" className={`navbar-link${location.pathname === '/login' ? ' active' : ''}`}>Login</Link>
        ) : (
          <button className="navbar-link logout-btn" onClick={handleLogout}>Logout</button>
        )}
        {!isLoggedIn && (
          <Link to="/signup" className={`navbar-link${location.pathname === '/signup' ? ' active' : ''}`}>Signup</Link>
        )}
        {isLoggedIn && (
          <div className="profile-icon" onClick={toggleProfilePopup}>👤</div>
        )}
      </div>
      {isProfilePopupVisible && (
        <div className="profile-popup">
          <h3>Profile Details</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Mobile Number:</strong> {user?.mobileNumber}</p>
          <p><strong>Address:</strong> {user?.address}</p>
          <p><strong>Gender:</strong> {user?.gender}</p>
          <p><strong>Organization:</strong> {user?.organization}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Location of Work:</strong> {user?.locationOfWork}</p>
          <p><strong>Date of Birth:</strong> {user?.dateOfBirth}</p>
          <p><strong>LinkedIn Profile:</strong> <a href={user?.linkedinProfile} target="_blank" rel="noopener noreferrer">{user?.linkedinProfile}</a></p>
          <button className="edit-button" onClick={openEditModal}>Edit</button>
        </div>
      )}
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
  //   );
  // };
    // </div>
  );
};


export default NavBar;
