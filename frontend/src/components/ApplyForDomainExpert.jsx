import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplyForDomainExpert.css';

const ApplyForDomainExpert = () => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    gender: '',
    photo: '',
    organization: '',
    role: '',
    locationOfWork: '',
    dateOfBirth: '',
    linkedinProfile: '',
    domain: '',
    cv: null,
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    setFormData((prev) => ({ ...prev, [name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/apply-domain-expert`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        navigate('/dashboard');
      } else {
        console.error('Error submitting application:', await response.text());
      }
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  return (
    <div className="apply-domain-expert-container">
      <h2>Apply for Domain Expert</h2>
      <form onSubmit={handleSubmit} className="apply-form">
        <label>
          Mobile Number:
          <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required />
        </label>
        <label>
          Gender:
          <select name="gender" value={formData.gender} onChange={handleInputChange} required>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Photo:
          <input type="file" name="photo" onChange={handleFileChange} required />
        </label>
        <label>
          Organization:
          <input type="text" name="organization" value={formData.organization} onChange={handleInputChange} required />
        </label>
        <label>
          Role:
          <input type="text" name="role" value={formData.role} onChange={handleInputChange} required />
        </label>
        <label>
          Location of Work:
          <input type="text" name="locationOfWork" value={formData.locationOfWork} onChange={handleInputChange} required />
        </label>
        <label>
          Date of Birth:
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required />
        </label>
        <label>
          LinkedIn Profile:
          <input type="url" name="linkedinProfile" value={formData.linkedinProfile} onChange={handleInputChange} required />
        </label>
        <label>
          Domain:
          <input type="text" name="domain" value={formData.domain} onChange={handleInputChange} required />
        </label>
        <label>
          Upload CV:
          <input type="file" name="cv" onChange={handleFileChange} required />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ApplyForDomainExpert;
