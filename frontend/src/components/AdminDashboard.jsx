import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('users');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}api/requests`);
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, []);

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

  const handleReject = async (requestId) => {
    try {
      await fetch(`${BACKEND_URL}api/requests/${requestId}`, {
        method: 'DELETE',
      });
      alert('Request rejected successfully!');
      setRequests(requests.filter((request) => request._id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}api/requests`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUsers = async (userType) => {
    try {
      console.log(`Fetching users of type: ${userType}`);
      const response = await fetch(`${BACKEND_URL}api/auth/users?userType=${userType}`);
      const data = await response.json();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers(view === 'users' ? 'normal' : 'domain_expert');
  }, [view]);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
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
      {/* <button className="notification-button" onClick={fetchNotifications}>
        Show Notifications
      </button> */}

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
  );
};

export default AdminDashboard;
