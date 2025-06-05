import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'normal'
  });
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();

  // Predefined user credentials
  const users = {
    'superadmin@example.com': { password: 'super123', type: 'super_admin' },
    'admin@example.com': { password: 'admin123', type: 'admin' },
    'provider@example.com': { password: 'provider123', type: 'service_provider' },
    'user@example.com': { password: 'user123', type: 'normal' }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const user = users[formData.email];
    
    if (!user) {
      setError('Invalid email address');
      return;
    }
    
    if (user.password !== formData.password) {
      setError('Invalid password');
      return;
    }
    
    if (user.type !== formData.userType) {
      setError('Invalid user type selected');
      return;
    }

    // Store login state
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userType', user.type);
    localStorage.setItem('userEmail', formData.email);

    // Redirect based on user type
    if (user.type === 'normal') {
      navigate('/marketplace');
    } else if (user.type === 'service_provider') {
      navigate('/service-calendar');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <img src={aicteLogo} alt="AICTE Logo" className="auth-logo" />
          </div>
          <h1>Jaipur Indovation Center</h1>
          <p>Sign in to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">User Type</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <option value="normal">Normal User</option>
              <option value="service_provider">Service Provider</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
        </div>

        <div className="demo-credentials">
          <div 
            className="credentials-header"
            onClick={() => setShowCredentials(!showCredentials)}
          >
            <h3>Demo Credentials</h3>
            <span className={`dropdown-arrow ${showCredentials ? 'open' : ''}`}>
              ▼
            </span>
          </div>
          
          {showCredentials && (
            <div className="credentials-grid">
              <div className="credential-item">
                <strong>Super Admin:</strong>
                <span>superadmin@example.com / super123</span>
              </div>
              <div className="credential-item">
                <strong>Admin:</strong>
                <span>admin@example.com / admin123</span>
              </div>
              <div className="credential-item">
                <strong>Service Provider:</strong>
                <span>provider@example.com / provider123</span>
              </div>
              <div className="credential-item">
                <strong>Normal User:</strong>
                <span>user@example.com / user123</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 