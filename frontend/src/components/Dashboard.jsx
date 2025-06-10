import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import aicteLogo from '../assets/aicte_logo.png';
import './Dashboard.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useUser();
  const [userType, setUserType] = useState('');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('users');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setUserType(user.userType);
  }, [user, navigate]);

  // Fetch users for admin
  const fetchUsers = async (userType) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/auth/users?userType=${userType}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch requests for admin or user
  const fetchRequests = async () => {
    try {
      if (userType === 'admin' || userType === 'super_admin') {
        const response = await fetch(`${BACKEND_URL}api/requests/all-requests`);
        const data = await response.json();
        setRequests(data);
      } else {
        const response = await fetch(`${BACKEND_URL}api/requests/${user.id}`);
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    if (userType === 'admin' || userType === 'super_admin') {
      fetchUsers(view === 'users' ? 'normal' : 'domain_expert');
      if (view === 'requests') fetchRequests();
    } else {
      fetchRequests();
    }
  }, [userType, view]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const applyForServiceProvider = async () => {
    try {
      const newRequest = {
        userEmail: user.email,
        requested_user_type: 'service_provider',
      };
      const response = await fetch(`${BACKEND_URL}api/requests/${user.id}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${BACKEND_URL}api/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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

  const formatUserType = (type) => {
    if (!type) return '';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <img src={aicteLogo} alt="AICTE Logo" className="header-logo" />
          <h1>Welcome, {user?.name}</h1>
          <br />
          <h2>Dashboard</h2>
        </div>
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>User Information</h2>
          <div className="user-type-badge">
            <span className="badge-label">User Type:</span>
            <span className={`badge ${userType}`}>{formatUserType(userType)}</span>
          </div>
          {/* Admin-specific features */}
          {(userType === 'admin' || userType === 'super_admin') && (
            <div className="view-toggle">
              <label>
                <input type="radio" name="view" value="users" checked={view === 'users'} onChange={() => setView('users')} /> Users
              </label>
              <label>
                <input type="radio" name="view" value="experts" checked={view === 'experts'} onChange={() => setView('experts')} /> Experts
              </label>
              <label>
                <input type="radio" name="view" value="requests" checked={view === 'requests'} onChange={() => setView('requests')} /> Requests
              </label>
            </div>
          )}
          {/* Normal user actions */}
          {userType === 'normal' && (
            <div className="dashboard-actions">
              <button onClick={applyForServiceProvider} className="nav-button">Apply for Service Provider</button>
              <button onClick={fetchRequests} className="nav-button">View Requests</button>
            </div>
          )}
          {/* Domain Expert view placeholder */}
          {userType === 'domain_expert' && (
            <div className="dashboard-actions">
              <h3>Domain Expert View</h3>
              <p>Feature coming soon...</p>
            </div>
          )}
          {/* Super Admin view placeholder */}
          {userType === 'super_admin' && (
            <div className="dashboard-actions">
              <h3>Super Admin View</h3>
              <p>Feature coming soon...</p>
            </div>
          )}
        </div>
      </div>
      {/* Admin tables */}
      {(userType === 'admin' || userType === 'super_admin') && (
        <div className="dashboard-content">
          {view === 'users' && (
            <table className="users-table">
              <thead>
                <tr><th>Name</th><th>Mobile Number</th><th>Email</th></tr>
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
                <tr><th>Name</th><th>Mobile Number</th><th>Email</th></tr>
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
                <tr><th>Email</th><th>Requested User Type</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.userEmail}</td>
                    <td>{request.requested_user_type}</td>
                    <td>
                      <button onClick={() => handleAccept(request._id, request.userId)} className="action-btn">Accept</button>
                      {/* <button onClick={() => handleReject(request._id)} className="action-btn">Reject</button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* User requests list */}
      {userType === 'normal' && (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-item">
              <p>Type: {request.type || request.requested_user_type}</p>
              <p>Status: {request.status}</p>
              <button onClick={() => deleteRequest(request._id)} className="delete-button">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
