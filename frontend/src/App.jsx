import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Marketplace from './components/Marketplace';
import Profile from './components/Profile';
import Cart from './components/Cart';
import ServiceCalendar from './components/ServiceCalendar';
import ServiceBooking from './components/ServiceBooking';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/service-calendar" element={<ServiceCalendar />} />
          <Route path="/service-booking" element={<ServiceBooking />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 