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
import ManageEvents from './components/ManageEvents';
import ApplyForDomainExpert from './components/ApplyForDomainExpert';
import CreateEvent from './components/CreateEvent';
import Profile from './components/Profile';
import AvailabilityManager from './components/AvailabilityManager';
import CreateSession from './components/CreateSession';
import Impact from './components/Impact';
import EventsStats from './components/EventsStats';
import DomainExpertStats from './components/DomainExpertStats';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <NavBar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Marketplace />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/impact/events-stats" element={<EventsStats />} />
          <Route path="/DomainExpertStats" element={<DomainExpertStats />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/service-calendar" element={<ServiceCalendar />} />
          <Route path="/service-booking" element={<ServiceBooking />} />
          <Route path="/apply-for-domain-expert" element={<ApplyForDomainExpert />} />
          <Route path="/manage-events" element={<ManageEvents />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/create-session" element={<CreateSession />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
