import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEvent.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    category: '',
    image: null,
    availableSeats: '',
    organizer: '',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users from the backend
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}api/auth/users?userType=admin`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        formDataToSend.append(key, value);
      }
    });

    // Debugging: Log all appended values
    for (let pair of formDataToSend.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
      const response = await fetch(`${BACKEND_URL}api/events`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        alert('Event created successfully!');
        navigate('/manage-events');
      } else {
        const errorText = await response.text();
        console.error('Error creating event:', errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <div className="create-event-container">
      <h2>Create Event</h2>
      <form onSubmit={handleSubmit} className="create-event-form">
        <label>
          Event ID:
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Title:
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Description:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Time:
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          End Time:
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Location:
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Category:
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            <option value="ip_consultancy">IP Consultancy</option>
            <option value="company_registration">Company Registration</option>
            <option value="mentoring">Mentoring</option>
            <option value="expert_guidance">Expert Guidance</option>
          </select>
        </label>
        <label>
          Image:
          <input
            type="file"
            name="image"
            onChange={handleFileChange}
            // required
          />
        </label>
        <label>
          Available Seats:
          <input
            type="number"
            name="availableSeats"
            value={formData.availableSeats}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Organizer:
          <input
            type="text"
            name="organizer"
            value={formData.organizer}
            onChange={handleInputChange}
            required
          />
        </label>
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default CreateEvent;
