import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Cart from './components/Cart';
import ServiceCalendar from './components/ServiceCalendar';
import ServiceBooking from './components/ServiceBooking';
import './App.css';

function App() {
  return (
    <Router>
      <NavBar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/service-calendar" element={<ServiceCalendar />} />
          <Route path="/service-booking" element={<ServiceBooking />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
