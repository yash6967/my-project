import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const [profileData, setProfileData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID not found in localStorage');
        }

        const response = await api.get(`/users/${userId}`);
        setProfileData(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        navigate('/login');
      }
    };

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      fetchProfileData();
    }
  }, [navigate]);

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <div className="profile-details">
        <p><strong>Name:</strong> {profileData.name}</p>
        <p><strong>Email:</strong> {profileData.email}</p>
        <p><strong>User Type:</strong> {profileData.userType}</p>
      </div>
    </div>
  );
};

export default Profile;
