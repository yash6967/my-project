import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import aicteLogo from '../assets/aicte_logo.png';
import './Dashboard.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationBox from './ConfirmationBox';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useUser();
  const [userType, setUserType] = useState('');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    publishedSessions: 0,
    completedSessions: 0,
    draftSessions: 0
  });
  const [view, setView] = useState('users');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [expertBookings, setExpertBookings] = useState([]);
  const [logs, setLogs] = useState([]); // For admin logs view
  const [confirmBox, setConfirmBox] = useState({ isOpen: false, title: '', message: '', onConfirm: null, danger: false });
  const navigate = useNavigate();
  const location = useLocation();
  const [editingMessageIdx, setEditingMessageIdx] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [savingMessage, setSavingMessage] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setUserType(user.userType);
  }, [user, navigate]);

  // Check URL parameters for view
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && ['users', 'experts', 'requests', 'logs'].includes(viewParam)) {
      setView(viewParam);
    }
  }, [location.search]);

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
        const id = localStorage.getItem('userId');
        const response = await fetch(`${BACKEND_URL}api/requests/${id}`);
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  // Fetch logs for admin
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${BACKEND_URL}api/logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      setLogs([]);
    }
  };

  useEffect(() => {
    if (userType === 'admin' || userType === 'super_admin') {
      if (view === 'users') {
        fetchUsers('normal');
      } else if (view === 'experts') {
        fetchUsers('domain_expert');
      } else if (view === 'requests') {
        fetchRequests();
      } else if (view === 'logs') {
        fetchLogs();
      }
    } else {
      fetchRequests();
    }

    // Fetch user details for all user types
    const fetchUserDetails = async () => {
      try {
        const id = localStorage.getItem('userId');
        const response = await fetch(`${BACKEND_URL}api/auth/user-details/${id}`);
        const data = await response.json();
        console.log('User Details:', data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [userType, view]);

  useEffect(() => {
    if (userType === 'domain_expert') {
      fetchExpertBookings();
    }
  }, [userType]);

  const fetchExpertBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${BACKEND_URL}api/slots/bookings-for-expert`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpertBookings(data);
      } else {
        setExpertBookings([]);
      }
    } catch (error) {
      setExpertBookings([]);
    }
  };

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
        toast.success('Request submitted successfully!');
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
        toast.success('Request deleted successfully!');
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
      const response = await fetch(`${BACKEND_URL}api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });
      
      if (response.ok) {
        toast.success('Request approved and user type updated successfully!');
        fetchRequests();
      } else {
        toast.error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error approving request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      if (response.ok) {
        toast.success('Request rejected successfully!');
        fetchRequests();
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error rejecting request');
    }
  };

  const handleEdit = async (updatedDetails) => {
    try {
      const response = await fetch(`${BACKEND_URL}api/auth/user-details/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDetails),
      });
      if (response.ok) {
        toast.success('User details updated successfully!');
        // Optionally, refetch user details to update the UI
        const updatedUser = await response.json();
        console.log('Updated User:', updatedUser);
      } else {
        console.error('Error updating user details:', await response.text());
      }
    } catch (error) {
      console.error('Error updating user details:', error);
    }
  };

  const formatUserType = (type) => {
    if (!type) return '';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const saveChanges = () => {
    handleEdit(editDetails);
    closeEditModal();
  };

  const navigateToDomainExpertForm = () => {
    navigate('/apply-for-domain-expert');
  };

  // Filtered data based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobileNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRequests = requests.filter(
    (request) =>
      request.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_user_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      (log.userId?.name && log.userId.name.toLowerCase().includes(search)) ||
      (log.userId?.email && log.userId.email.toLowerCase().includes(search)) ||
      (log.action && log.action.toLowerCase().includes(search)) ||
      (typeof log.details === 'object' && log.details !== null &&
        Object.values(log.details).some(v => String(v).toLowerCase().includes(search)))
    );
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="user-info-card">
        <h2>Dashboard</h2>
        <div className="user-type-badge">
            {/* <span className="badge-label">User Type:</span> */}
            <span className={`badge ${userType}`}>{formatUserType(userType) + ' Controls' }</span>
          </div>
          {/* 
          
          <div className="user-details">
            <h3>Details:</h3>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Mobile:</strong> {user?.mobileNumber}</p>
            <p><strong>Address:</strong> {user?.address}</p>
            <p><strong>Gender:</strong> {user?.gender}</p>
            <p><strong>Organization:</strong> {user?.organization}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Location of Work:</strong> {user?.locationOfWork}</p>
            <p><strong>Date of Birth:</strong> {user?.dateOfBirth}</p>
            <p><strong>LinkedIn Profile:</strong> <a href={user?.linkedinProfile} target="_blank" rel="noopener noreferrer">{user?.linkedinProfile}</a></p>
            <button className="edit-button" onClick={openEditModal}>Edit</button>
           </div> */}

          {(userType === 'admin' || userType === 'super_admin') && (
            <div className="view-toggle">
              <label className={view === 'users' ? 'selected' : ''}>
                <input type="radio" name="view" value="users" checked={view === 'users'} onChange={() => setView('users')} /> Users
              </label>
              <label className={view === 'experts' ? 'selected' : ''}>
                <input type="radio" name="view" value="experts" checked={view === 'experts'} onChange={() => setView('experts')} /> Experts
              </label>
              <label className={view === 'requests' ? 'selected' : ''}>
                <input type="radio" name="view" value="requests" checked={view === 'requests'} onChange={() => setView('requests')} /> Requests
              </label>
              <label className={view === 'logs' ? 'selected' : ''}>
                <input type="radio" name="view" value="logs" checked={view === 'logs'} onChange={() => setView('logs')} /> Logs
              </label>
            </div>
          )}
          {/* Search bar for tables */}
          {(userType === 'admin' || userType === 'super_admin') && (
            <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
              <input
                type="text"
                placeholder={`Search ${view}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="dashboard-search-bar"
              />
            </div>
          )}
          {userType === 'normal' && (
            <div className="dashboard-actions">
              <button onClick={fetchRequests} className="nav-button">View Requests</button>
            </div>
          )}
          {userType === 'domain_expert' && (
            <div className="my-bookings-section">
              <div className="sessions-header">
                <h3>My Bookings</h3>
                <button className="create-session-btn" onClick={() => navigate('/create-session')}>
                  <span className="btn-icon">+</span>
                  Create New Session
                </button>
              </div>
              {expertBookings.length === 0 ? (
                <p>No bookings yet.</p>
              ) : (
                <div className="my-bookings-table-responsive">
                  <table className="my-bookings-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>User Email</th>
                        <th>Date</th>
                        <th>Time Slot</th>
                        <th>Status</th>
                        <th>Action</th>
                        <th>Meeting Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expertBookings.map((booking, idx) => (
                        <tr key={idx}>
                          <td data-label="User Name">{booking.user?.name || 'N/A'}</td>
                          <td data-label="User Email">{booking.user?.email || 'N/A'}</td>
                          <td data-label="Date">{booking.date}</td>
                          <td data-label="Time Slot">{booking.startTime} - {booking.endTime}</td>
                          <td data-label="Status">
                            <span style={{
                              color: booking.isAccepted ? 'green' : booking.isRejected ? 'red' : 'orange',
                              fontWeight: 600
                            }}>
                              {booking.isAccepted
                                ? 'Accepted'
                                : booking.isRejected
                                ? 'Rejected'
                                : 'Pending'}
                            </span>
                          </td>
                          <td data-label="Action">
                            {!booking.isAccepted && !booking.isRejected && (
                              <>
                                <button
                                  style={{
                                    marginRight: 8,
                                    background: '#27ae60',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '6px 14px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseOver={e => (e.currentTarget.style.background = '#219150')}
                                  onMouseOut={e => (e.currentTarget.style.background = '#27ae60')}
                                  onClick={() => {
                                    setConfirmBox({
                                      isOpen: true,
                                      title: 'Accept Booking',
                                      message: 'Are you sure you want to accept this booking?',
                                      onConfirm: async () => {
                                        const token = localStorage.getItem('token');
                                        await fetch(`${BACKEND_URL}api/slots/booking-status`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                          },
                                          body: JSON.stringify({
                                            date: booking.date,
                                            startTime: booking.startTime,
                                            endTime: booking.endTime,
                                            userId: booking.userId,
                                            isAccepted: true,
                                            isRejected: false
                                          })
                                        });
                                        fetchExpertBookings();
                                        setConfirmBox(prev => ({ ...prev, isOpen: false }));
                                      },
                                      danger: false
                                    });
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  style={{
                                    background: '#e74c3c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '6px 14px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseOver={e => (e.currentTarget.style.background = '#c0392b')}
                                  onMouseOut={e => (e.currentTarget.style.background = '#e74c3c')}
                                  onClick={() => {
                                    setConfirmBox({
                                      isOpen: true,
                                      title: 'Reject Booking',
                                      message: 'Are you sure you want to reject this booking?',
                                      onConfirm: async () => {
                                        const token = localStorage.getItem('token');
                                        await fetch(`${BACKEND_URL}api/slots/booking-status`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                          },
                                          body: JSON.stringify({
                                            date: booking.date,
                                            startTime: booking.startTime,
                                            endTime: booking.endTime,
                                            userId: booking.userId,
                                            isAccepted: false,
                                            isRejected: true
                                          })
                                        });
                                        fetchExpertBookings();
                                        setConfirmBox(prev => ({ ...prev, isOpen: false }));
                                      },
                                      danger: true
                                    });
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                          <td data-label="Message">
                            {editingMessageIdx === idx ? (
                              <div className="message-edit-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <input
                                  type="text"
                                  value={editedMessage}
                                  onChange={e => setEditedMessage(e.target.value)}
                                  style={{ minWidth: 120, flex: '1 1 120px', maxWidth: '100%' }}
                                  disabled={savingMessage}
                                />
                                <button
                                className='action-btn approve-btn'
                                  onClick={async () => {
                                    setSavingMessage(true);
                                    try {
                                      const token = localStorage.getItem('token');
                                      const res = await fetch(`${BACKEND_URL}api/slots/edit-message`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                          date: booking.date,
                                          startTime: booking.startTime,
                                          endTime: booking.endTime,
                                          message: editedMessage
                                        })
                                      });
                                      if (res.ok) {
                                        toast.success('Meeting link updated!');
                                        setEditingMessageIdx(null);
                                        setEditedMessage('');
                                        fetchExpertBookings();
                                      } else {
                                        const data = await res.json();
                                        toast.error(data.error || 'Failed to update meeting link');
                                      }
                                    } catch (err) {
                                      toast.error('Failed to update meeting link');
                                    }
                                    setSavingMessage(false);
                                  }}
                                  disabled={savingMessage}
                                  // style={{ marginLeft: 4, marginTop: 4, flex: '0 0 auto' }}
                                >
                                  Save
                                </button>
                                <button
                                className="action-btn reject-btn"
                                  onClick={() => {
                                    setEditingMessageIdx(null);
                                    setEditedMessage('');
                                  }}
                                  disabled={savingMessage}
                                  style={{ marginLeft: 4, marginTop: 4, flex: '0 0 auto' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span>{booking.message || <span style={{ color: '#aaa' }}>Add link</span>}</span>
                                <button
                                className="message-edit-btn"
                                  onClick={() => {
                                    setEditingMessageIdx(idx);
                                    setEditedMessage(booking.message || '');
                                  }}
                                  // style={{ marginLeft: 4, fontSize: 12, padding: '2px 8px', marginTop: 4, flex: '0 0 auto' }}
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {userType === 'super_admin' && (
            <div className="dashboard-actions">
              <h3>Super Admin View</h3>
              <p>Feature coming soon...</p>
            </div>
          )}
          {(userType === 'admin' || userType === 'super_admin') && (
            <div className="dashboard-content">
              {view === 'users' && (
                <div>
                  <table className="users-table">
                    <thead>
                      <tr><th>Name</th><th>Mobile Number</th><th>Email</th></tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.mobileNumber}</td>
                          <td>{user.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {view === 'experts' && (
                <div>
                  <table className="experts-table">
                    <thead>
                      <tr><th>Name</th><th>Mobile Number</th><th>Email</th></tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.mobileNumber}</td>
                          <td>{user.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {view === 'requests' && (
                <div>
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Organization</th>
                        <th>Role</th>
                        <th>Requested Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request._id}>
                          <td>{request.name}</td>
                          <td>{request.userEmail}</td>
                          <td>{request.mobileNumber}</td>
                          <td>{request.organization}</td>
                          <td>{request.role}</td>
                          <td>{request.requested_user_type}</td>
                          <td>
                            <span className={`status-badge ${request.status}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            {request.status === 'pending' && (
                              <div className="action-buttons">
                                <button 
                                  onClick={() => handleAccept(request._id, request.userId)} 
                                  className="action-btn approve-btn"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleReject(request._id)} 
                                  className="action-btn reject-btn"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {view === 'logs' && (
                <div>
                  <h3>System Logs</h3>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr><td colSpan="4">No logs found.</td></tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log._id}>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>{
                              log.userId && typeof log.userId === 'object'
                                ? `${log.userId.name || log.userId.email || log.userId._id || 'N/A'} (${log.userId._id || 'N/A'})`
                                : log.userId || 'N/A'
                            }</td>
                            <td>{log.action}</td>
                            <td>{
                              typeof log.details === 'object' && log.details !== null
                                ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                                : String(log.details)
                            }</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {userType === 'normal' && (
        <div className="requests-section">
          <h3>My Requests</h3>
          {requests.length === 0 ? (
            <p className="no-requests">No requests found.</p>
          ) : (
            <div className="requests-table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Request Type</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    {/* <th>Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        <span className="request-type">
                          {request.requested_user_type === 'domain_expert' ? 'Domain Expert' : 
                           request.requested_user_type === 'service_provider' ? 'Service Provider' : 
                           request.requested_user_type}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      {/* <td>
                        <button 
                          onClick={() => deleteRequest(request._id)} 
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
      <ConfirmationBox
        isOpen={confirmBox.isOpen}
        title={confirmBox.title}
        message={confirmBox.message}
        confirmText="Yes"
        cancelText="No"
        danger={!!confirmBox.danger}
        onConfirm={() => {
          if (typeof confirmBox.onConfirm === 'function') confirmBox.onConfirm();
        }}
        onCancel={() => setConfirmBox(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Dashboard;
