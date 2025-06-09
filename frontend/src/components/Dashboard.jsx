import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './Dashboard.css';



const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [userType, setUserType] = useState('');
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const formatUserType = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const fetchRequests = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${BACKEND_URL}/requests/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const applyForServiceProvider = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      const newRequest = {
        userEmail,
        requested_user_type: 'service_provider',
      };
      const response = await fetch(`${BACKEND_URL}/requests/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      });
      if (response.ok) {
        alert('Request submitted successfully!');
        fetchRequests();
      } else {
        console.error('Error submitting request:', await response.text());
      }
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const deleteRequest = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        alert('Request deleted successfully!');
        fetchRequests();
      } else {
        console.error('Error deleting request:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
          <h1>Welcome, {localStorage.getItem('userName')}</h1>
          <br />
          <h2> Dashboard</h2>
        </div>
        <div className="header-actions">
          <Link to="/service-booking" className="nav-button">
            📅 Domain Experts
          </Link>
          <Link to="/marketplace" className="nav-button">
            📅 Events
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>User Information</h2>
          <div className="user-type-badge">
            <span className="badge-label">User Type:</span>
            <span className={`badge ${userType}`}>
              {formatUserType(userType)}
            </span>
          </div>
          
          <div className="permissions">
            <h3>Your Permissions:</h3>
            <ul>
              {userType === 'super_admin' && (
                <>
                  <li>✅ Full system access</li>
                  <li>✅ Manage all users</li>
                  <li>✅ System configuration</li>
                  <li>✅ View all reports</li>
                  <li>✅ Event management</li>
                  <li>✅ Service provider management</li>
                </>
              )}
              {userType === 'admin' && (
                <>
                  <li>✅ Manage users</li>
                  <li>✅ View reports</li>
                  <li>✅ Moderate content</li>
                  <li>✅ Event management</li>
                  <li>✅ View service bookings</li>
                  <li>❌ System configuration</li>
                </>
              )}
            </ul>
          </div>

          <div className="admin-actions">
            <h3>Quick Actions:</h3>
            <div className="action-buttons">
              <button className="action-btn">Manage Events</button>
              <button className="action-btn">View Analytics</button>
              <button className="action-btn">User Management</button>
              <Link to="/service-booking" className="action-btn">
                Service Providers
              </Link>
              <button className="action-btn">System Settings</button>
            </div>
          </div>

          <div className="system-overview">
            <h3>System Overview:</h3>
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-number">4</span>
                <span className="stat-label">User Types</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">6</span>
                <span className="stat-label">Active Events</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">Service Providers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">12</span>
                <span className="stat-label">Total Bookings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={applyForServiceProvider} className="nav-button">
          Apply for Service Provider
        </button>
        <button onClick={fetchRequests} className="nav-button">
          View Requests
        </button>
      </div>
      <div className="requests-list">
        {requests.map((request) => (
          <div key={request._id} className="request-item">
            <p>Type: {request.type}</p>
            <p>Status: {request.status}</p>
            <button onClick={() => deleteRequest(request._id)} className="delete-button">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
