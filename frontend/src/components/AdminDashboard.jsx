import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/requests');
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (requestId, userId) => {
    try {
      await api.put(`/users/${userId}/toggle-usertype`);
      alert('Request accepted and user type updated successfully!');
      setRequests(requests.filter((request) => request._id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.delete(`/requests/${requestId}`);
      alert('Request rejected successfully!');
      setRequests(requests.filter((request) => request._id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <table className="requests-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Type of Request</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request._id}>
              <td>{request.userName}</td>
              <td>{request.type}</td>
              <td>
                <button
                  className="accept-button"
                  onClick={() => handleAccept(request._id, request.userId)}
                >
                  Accept
                </button>
                <button
                  className="reject-button"
                  onClick={() => handleReject(request._id)}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
