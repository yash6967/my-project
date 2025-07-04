import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';
import ConfirmationBox from './ConfirmationBox';
import defaultProfileImage from '../images/default-profile.png';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const DOMAIN_OPTIONS = [
  { value: 'ip_consultancy', label: 'IP Consultancy' },
  { value: 'company_registration', label: 'Company Registration' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'expert_guidance', label: 'Expert Guidance' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [hasAppliedForDomainExpert, setHasAppliedForDomainExpert] = useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
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
    Domain: user?.Domain || '',
  });
  const [bookedExperts, setBookedExperts] = useState([]);
  const [confirmBox, setConfirmBox] = useState({ isOpen: false, title: '', message: '', onConfirm: null, danger: false });
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Fetch user details from backend
    fetchUserDetails();
    
    // Fetch user's registered events
    fetchRegisteredEvents();
    
    // Check if user has already applied for domain expert
    checkDomainExpertApplication();
    fetchBookedExperts();
  }, [navigate]);

  const checkDomainExpertApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) return;

      const response = await fetch(`${BACKEND_URL}api/requests/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const requests = await response.json();
        // Only consider pending applications, not approved or rejected ones
        const hasApplied = requests.some(request => 
          request.requested_user_type === 'domain_expert' && 
          request.status === 'pending'
        );
        setHasAppliedForDomainExpert(hasApplied);
      }
    } catch (error) {
      console.error('Error checking domain expert application:', error);
    } finally {
      setIsCheckingApplication(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use the new API endpoint to get user events with full details
      const response = await fetch(`${BACKEND_URL}api/user/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegisteredEvents(data.events || []);
      } else {
        console.error('Failed to fetch user events');
        setRegisteredEvents([]);
      }
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setRegisteredEvents([]);
    }
  };

  const fetchBookedExperts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${BACKEND_URL}api/slots/booked-by-user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookedExperts(data);
      } else {
        setBookedExperts([]);
      }
    } catch (error) {
      setBookedExperts([]);
    }
  };

  const validateUserDetails = () => {
    const requiredFields = [
      'name', 'email', 'mobileNumber', 'address', 'gender', 
      'organization', 'role', 'locationOfWork', 'dateOfBirth', 'linkedinProfile'
    ];
    
    const missingFields = requiredFields.filter(field => !user[field] || user[field].trim() === '');
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => 
        field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      );
      toast.error(`Please fill in all required fields: ${fieldNames.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const applyForDomainExpert = async () => {
    if (!validateUserDetails()) {
      return; // Don't proceed if validation fails
    }

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      const requestData = {
        userEmail: user.email,
        requested_user_type: 'domain_expert',
        name: user.name,
        mobileNumber: user.mobileNumber,
        address: user.address,
        gender: user.gender,
        organization: user.organization,
        role: user.role,
        locationOfWork: user.locationOfWork,
        dateOfBirth: user.dateOfBirth,
        linkedinProfile: user.linkedinProfile
      };

      const response = await fetch(`${BACKEND_URL}api/requests/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast.success('Domain Expert application submitted successfully!');
        // Only refresh application status after successful submission
        await checkDomainExpertApplication();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for domain expert:', error);
      toast.error('An error occurred while submitting your application');
    }
  };

  const openEditModal = async () => {
    try {
      setIsLoadingUserData(true);
      
      // Fetch latest user data from backend
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}api/auth/user-details/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setEditDetails({
          name: userData.name || '',
          email: userData.email || '',
          mobileNumber: userData.mobileNumber || '',
          address: userData.address || '',
          gender: userData.gender || '',
          organization: userData.organization || '',
          role: userData.role || '',
          locationOfWork: userData.locationOfWork || '',
          dateOfBirth: userData.dateOfBirth || '',
          linkedinProfile: userData.linkedinProfile || '',
          Domain: userData.Domain || '',
        });
        setIsEditModalOpen(true);
      } else {
        toast.error('Failed to load user data');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error loading user data');
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditDetails((prev) => ({ ...prev, [name]: value }));
  };

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      console.log('Fetching user details for userId:', userId);
      
      if (!token || !userId) return;

      const response = await fetch(`${BACKEND_URL}api/auth/user-details/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Fetch user details response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Fetched user data from backend:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('Failed to fetch user details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const saveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      console.log('Saving changes with userId:', userId);
      console.log('Edit details to save:', editDetails);
      
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

      console.log('Backend response status:', response.status);
      
      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Backend returned updated user:', updatedUser);
        
        // Close modal first
        setIsEditModalOpen(false);
        
        // Refresh user data from backend
        await fetchUserDetails();
        
        toast.success('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${BACKEND_URL}api/slots/cancel-booking`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expertId: booking.expert?._id,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        })
      });
      if (response.ok) {
        toast.success('Booking cancelled successfully');
        fetchBookedExperts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  // Upload profile image
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BACKEND_URL}api/user/upload-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profile image uploaded!');
        fetchUserDetails();
      } else {
        toast.error(data.message || 'Failed to upload image');
      }
    } catch (err) {
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  // Change (replace) profile image
  const handleProfileImageReplace = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BACKEND_URL}api/user/reupload-photo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profile image replaced!');
        fetchUserDetails();
      } else {
        toast.error(data.message || 'Failed to replace image');
      }
    } catch (err) {
      toast.error('Error replacing image');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <div className="profile-photo-section">
          <img
            src={`${BACKEND_URL}profile_photo/${user.photo}`}
            alt="Profile"
            className="profile-photo"
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center', border: '3px solid #764ba2', background: '#f3f3f3', boxShadow: '0 2px 8px rgba(44,62,80,0.08)', aspectRatio: '1/1', overflow: 'hidden' }}
            onError={e => { e.target.onerror = null; e.target.src = defaultProfileImage; }}
          />
          <div style={{ marginTop: 8 }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={user.image ? handleProfileImageReplace : handleProfileImageUpload}
            />
            <button
              className="upload-photo-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : user.image ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>
        </div>
        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={openEditModal}>
            Edit Profile
          </button>
          {/* ...existing domain expert buttons... */}
          {user.userType === 'normal' &&
            (hasAppliedForDomainExpert ? (
              <button className="view-requests-btn" onClick={() => navigate('/dashboard?view=requests')}>
                View Requests
              </button>
            ) : (
              <button
                className="apply-domain-expert-btn"
                onClick={() => {
                  setConfirmBox({
                    isOpen: true,
                    title: 'Apply for Domain Expert',
                    message: 'Are you sure you want to apply for Domain Expert? Your profile details will be submitted for review.',
                    onConfirm: applyForDomainExpert,
                    danger: false
                  });
                }}
              >
                Apply for Domain Expert
              </button>
            ))}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-details">
          <h2>Personal Information</h2>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Name:</label>
              <span>{user.name || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <span>{user.email || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Mobile Number:</label>
              <span>{user.mobileNumber || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Gender:</label>
              <span>{user.gender || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Date of Birth:</label>
              <span>{formatDate(user.dateOfBirth)}</span>
            </div>
            <div className="profile-field">
              <label>Address:</label>
              <span>{user.address || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Organization:</label>
              <span>{user.organization || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Role:</label>
              <span>{user.role || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>Location of Work:</label>
              <span>{user.locationOfWork || 'N/A'}</span>
            </div>
            <div className="profile-field">
              <label>LinkedIn Profile:</label>
              <span>
                {user.linkedinProfile ? (
                  <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                ) : (
                  'N/A'
                )}
              </span>
            </div>
            <div className="profile-field">
              <label>Domain:</label>
              <span>
                {user.Domain ? (
                  DOMAIN_OPTIONS.find(opt => opt.value === user.Domain)?.label || user.Domain
                ) : (
                  'N/A'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Booked Experts Section */}
        <div className="booked-experts-section">
          {bookedExperts.length === 0 ? (
            <>
              <h2>Booked Experts</h2>
              <p>You have not booked any experts yet.</p>
            </>
          ) : (
            <div style={{overflowX: 'auto', width: '100%'}}>
              <h2>Booked Experts</h2>
              <table className="booked-experts-table">
                <thead>
                  <tr>
                    <th>Expert Name</th>
                    <th>Organization</th>
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                    {/* <th>Action</th> */}
                    <th>Meeting Link</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedExperts.map((booking, idx) => (
                    <tr key={idx}>
                      <td>{booking.expert?.name || 'N/A'}</td>
                      <td>{booking.expert?.organization || 'N/A'}</td>
                      <td>{booking.date}</td>
                      <td>{booking.startTime} - {booking.endTime}</td>
                      <td>
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
                      {/* <td>
                        <button
                          className="cancel-booking-btn"
                          onClick={() => {
                            setConfirmBox({
                              isOpen: true,
                              title: 'Cancel Booking',
                              message: 'Are you sure you want to cancel this booking?',
                              onConfirm: () => handleCancelBooking(booking),
                              danger: true
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </td> */}
                      <td>{booking.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="registered-events">
          <h2>Registered Events</h2>
          {registeredEvents.length === 0 ? (
            <p className="no-events">No events registered yet.</p>
          ) : (
            <div style={{overflowX: 'auto', width: '100%'}}>
              <table className="booked-experts-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Organizer</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredEvents.map((event) => (
                    <tr key={event._id}>
                      <td>{event.title}</td>
                      <td>{formatDate(event.date)}</td>
                      <td>{formatTime(event.time)} - {formatTime(event.endTime)}</td>
                      <td>{event.location}</td>
                      <td>{event.category}</td>
                      <td>{event.organizer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button
              className="back-btn"
              style={{ position: 'absolute', left: 16, top: 16 }}
              onClick={closeEditModal}
            >
              ← Back
            </button>
            <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
            {isLoadingUserData ? (
              <div className="loading-indicator">
                <p>Loading user data...</p>
              </div>
            ) : (
              <>
                <div className="modal-form">
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
                    <select
                      name="gender"
                      value={editDetails.gender || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
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
                  <label>
                    Domain:
                    <select
                      name="Domain"
                      value={editDetails.Domain || ''}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Domain</option>
                      {DOMAIN_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="modal-actions">
                  <button onClick={saveChanges} className="save-btn">Save</button>
                  <button onClick={closeEditModal} className="cancel-btn">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Box */}
      <ConfirmationBox
        isOpen={confirmBox.isOpen}
        title={confirmBox.title}
        message={confirmBox.message}
        confirmText="Yes"
        cancelText="No"
        danger={!!confirmBox.danger}
        onConfirm={() => {
          if (typeof confirmBox.onConfirm === 'function') confirmBox.onConfirm();
          setConfirmBox((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmBox((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Profile;
