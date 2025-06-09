import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './AdminDashboard.css';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('users');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Header logic (copied from Dashboard)
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchRequests = async () => {
    try {
      console.log('Calling API to fetch all requests');
      const response = await fetch(`${BACKEND_URL}api/requests/all-requests`);
      const data = await response.json();
      console.log('API response:', data);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    if (view === 'requests') {
      console.log('View changed to requests, fetching data');
      fetchRequests();
    }
  }, [view]);

  // useEffect(() => {
  //   const fetchRequests = async () => {
  //     try {
  //       const response = await fetch(`${BACKEND_URL}api/requests`);
  //       const data = await response.json();
  //       setRequests(data);
  //     } catch (error) {
  //       console.error('Error fetching requests:', error);
  //     }
  //   };

  //   fetchRequests();
  // }, []);

  const handleAccept = async (requestId, userId) => {
    try {
      await fetch(`${BACKEND_URL}api/users/${userId}/toggle-usertype`, {
        method: 'PUT',
      });
      alert('Request accepted and user type updated successfully!');
      setRequests(requests.filter((request) => request._id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  // const handleReject = async (requestId) => {
  //   try {
  //     await fetch(`${BACKEND_URL}api/requests/${requestId}`, {
  //       method: 'DELETE',
  //     });
  //     alert('Request rejected successfully!');
  //     setRequests(requests.filter((request) => request._id !== requestId));
  //   } catch (error) {
  //     console.error('Error rejecting request:', error);
  //   }
  // };

  // const fetchNotifications = async () => {
  //   try {
  //     const response = await fetch(`${BACKEND_URL}api/requests`);
  //     const data = await response.json();
  //     setNotifications(data);
  //   } catch (error) {
  //     console.error('Error fetching notifications:', error);
  //   }
  // };

  const fetchUsers = async (userType) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/auth/users?userType=${userType}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers(view === 'users' ? 'normal' : 'domain_expert');
  }, [view]);

  return (
    <div className="dashboard-container">
      {/* Header (copied from Dashboard) */}
      <div className="dashboard-header">
        <div className="header-left">
          <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
          <h1>Welcome, {localStorage.getItem('userName')}</h1>
          <span className="user-type-badge">Admin</span>
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
          {/* <div className="user-type-badge">
            <span className="badge-label">User Type:</span>
            <span className={`badge `}>
              
            </span>
          </div> */}
          {/* Admin-specific features */}
      <div className="view-toggle">
        <label>
          <input
            type="radio"
            name="view"
            value="users"
            checked={view === 'users'}
            onChange={() => setView('users')}
          />
          Users
        </label>
        <label>
          <input
            type="radio"
            name="view"
            value="experts"
            checked={view === 'experts'}
            onChange={() => setView('experts')}
          />
          Experts
        </label>
        <label>
          <input
            type="radio"
            name="view"
            value="requests"
            checked={view === 'requests'}
            onChange={() => setView('requests')}
          />
          Requests
        </label>
      </div>

      {view === 'users' && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile Number</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.mobileNumber}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'experts' && (
        <table className="experts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile Number</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.mobileNumber}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'requests' && (
        <table className="requests-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Requested User Type</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>{request.userEmail}</td>
                <td>{request.requested_user_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {notifications.length > 0 && (
        <div className="notifications">
          <h2>Notifications</h2>
          <ul>
            {notifications.map((notification) => (
              <li key={notification._id}>{notification.type} - {notification.userName}</li>
            ))}
          </ul>
        </div>
      )}
      </div>




        </div>

      
    </div>
  );
};

export default AdminDashboard;
