import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './Profile.css';

const Profile = () => {
  const [userType, setUserType] = useState('');
  const [userInfo, setUserInfo] = useState({});
  const navigate = useNavigate();

  // Sample user profile data
  const profileData = {
    name: 'John Doe',
    email: 'user@example.com',
    phone: '+91 9876543210',
    address: '123 Main Street, Mumbai, Maharashtra 400001',
    memberSince: '2023-01-15',
    totalEvents: 12,
    totalSpent: 25000,
    favoriteCategory: 'Technology'
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      setUserInfo(profileData);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const formatUserType = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-left">
            <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
            <h1>My Profile</h1>
          </div>
          <div className="header-actions">
            <Link to="/marketplace" className="nav-button">
              🏪 Marketplace
            </Link>
            <Link to="/service-booking" className="nav-button">
              📅 Services
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content">
        {/* User Info Card */}
        <div className="user-info-section">
          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-circle">
                <span className="avatar-text">{userInfo.name?.charAt(0) || 'U'}</span>
              </div>
            </div>
            
            <div className="profile-details">
              <h2>{userInfo.name}</h2>
              <div className="user-type-badge">
                <span className={`badge ${userType}`}>
                  {formatUserType(userType)}
                </span>
              </div>
              
              <div className="contact-info">
                <div className="info-item">
                  <span className="icon">📧</span>
                  <span>{userInfo.email}</span>
                </div>
                <div className="info-item">
                  <span className="icon">📱</span>
                  <span>{userInfo.phone}</span>
                </div>
                <div className="info-item">
                  <span className="icon">📍</span>
                  <span>{userInfo.address}</span>
                </div>
                <div className="info-item">
                  <span className="icon">📅</span>
                  <span>Member since {formatDate(userInfo.memberSince)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-value">{userInfo.totalEvents}</div>
              <div className="stat-label">Events Attended</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">₹{userInfo.totalSpent?.toLocaleString()}</div>
              <div className="stat-label">Total Spent</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❤️</div>
              <div className="stat-value">{userInfo.favoriteCategory}</div>
              <div className="stat-label">Favorite Category</div>
            </div>
          </div>
        </div>

        {/* Access Permissions */}
        <div className="permissions-section">
          <div className="permissions-card">
            <h3>Your Access & Permissions</h3>
            <div className="permissions-grid">
              <div className="permission-item allowed">
                <span className="permission-icon">✅</span>
                <div className="permission-details">
                  <h4>Event Marketplace</h4>
                  <p>Browse and purchase tickets for all available events</p>
                </div>
              </div>
              
              <div className="permission-item allowed">
                <span className="permission-icon">✅</span>
                <div className="permission-details">
                  <h4>Shopping Cart</h4>
                  <p>Add events to cart and manage your ticket purchases</p>
                </div>
              </div>
              
              <div className="permission-item allowed">
                <span className="permission-icon">✅</span>
                <div className="permission-details">
                  <h4>Profile Management</h4>
                  <p>View and update your personal information and preferences</p>
                </div>
              </div>
              
              <div className="permission-item allowed">
                <span className="permission-icon">✅</span>
                <div className="permission-details">
                  <h4>Event History</h4>
                  <p>View your past event purchases and attendance history</p>
                </div>
              </div>
              
              <div className="permission-item allowed">
                <span className="permission-icon">✅</span>
                <div className="permission-details">
                  <h4>Search & Filter</h4>
                  <p>Use advanced search and filtering options to find events</p>
                </div>
              </div>
              
              <div className="permission-item denied">
                <span className="permission-icon">❌</span>
                <div className="permission-details">
                  <h4>Event Management</h4>
                  <p>Create, edit, or delete events (Admin access required)</p>
                </div>
              </div>
              
              <div className="permission-item denied">
                <span className="permission-icon">❌</span>
                <div className="permission-details">
                  <h4>User Management</h4>
                  <p>Manage other users or access admin dashboard</p>
                </div>
              </div>
              
              <div className="permission-item denied">
                <span className="permission-icon">❌</span>
                <div className="permission-details">
                  <h4>System Configuration</h4>
                  <p>Modify system settings or platform configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <div className="actions-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <Link to="/marketplace" className="action-btn primary">
                <span className="btn-icon">🏪</span>
                Browse Events
              </Link>
              <Link to="/cart" className="action-btn secondary">
                <span className="btn-icon">🛒</span>
                View Cart
              </Link>
              <button className="action-btn tertiary">
                <span className="btn-icon">📝</span>
                Edit Profile
              </button>
              <button className="action-btn tertiary">
                <span className="btn-icon">📊</span>
                Event History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 