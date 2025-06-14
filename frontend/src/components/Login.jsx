import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import aicteLogo from '../assets/aicte_logo.png';
import './Auth.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser(); // <-- get setUser from context

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.message) {
          setError(data.message);
        } else {
          setError('Login failed. Please try again.');
        }
        return;
      }

      // Store login state, user info, and token
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userType', data.user.userType);
      localStorage.setItem('events', JSON.stringify(data.user.events));
      localStorage.setItem('token', data.token);


      // Update context
      setUser(data.user);

      // Redirect based on userType
      
      navigate('/events');
      

    } catch (err) {
      setError('Server error. Please try again later.');
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

        {/* <div className="demo-credentials"> */}
          {/* <div 
            className="credentials-header"
            onClick={() => setShowCredentials(!showCredentials)}
          >
            <h3>Demo Credentials</h3>
            <span className={`dropdown-arrow ${showCredentials ? 'open' : ''}`}>
              ▼
            </span>
          </div> */}
          
          {/* {showCredentials && (
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
          )} */}
        {/* </div> */}
      </div>
    </div>
  );
};

export default Login;
