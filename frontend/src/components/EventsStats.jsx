import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { useUser } from '../context/UserContext';
import './EventsStats.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const categoryLabels = [
  { value: 'ip_consultancy', label: 'IP Consultancy' },
  { value: 'company_registration', label: 'Company Registration' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'expert_guidance', label: 'Expert Guidance' }
];

const AGE_RANGES = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-60', min: 46, max: 60 },
  { label: '60+', min: 61, max: 200 }
];

const GENDER_LABELS = ['male', 'female', 'other'];
const ROLE_LABELS = ['normal', 'domain_expert', 'admin', 'super_admin'];

const EventsStats = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantFilter, setParticipantFilter] = useState('gender');
  const [participantStats, setParticipantStats] = useState({});
  const [participantLoading, setParticipantLoading] = useState(false);
  
  // Admin-specific state
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    apiResponseTime: 0,
    errorRate: 0,
    activeFeatures: []
  });
  const [adminLoading, setAdminLoading] = useState(false);
  
  // Event Creation Trends filter state
  const [trendsFilter, setTrendsFilter] = useState('last6'); // 'last6', 'first6', 'all'

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}api/events`);
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch participant demographics for all registered users
  useEffect(() => {
    const fetchParticipantStats = async () => {
      setParticipantLoading(true);
      try {
        // Get all unique registered user IDs from all events
        const userIds = Array.from(new Set(events.flatMap(ev => ev.registeredUsers)));
        // Fetch user details in batches (max 50 at a time)
        const batchSize = 50;
        let users = [];
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize);
          const batchUsers = await Promise.all(
            batch.map(id => fetch(`${BACKEND_URL}api/auth/user-details/${id}`).then(res => res.ok ? res.json() : null))
          );
          users = users.concat(batchUsers.filter(Boolean));
        }
        // Aggregate by filter
        let stats = {};
        if (participantFilter === 'gender') {
          stats = GENDER_LABELS.reduce((acc, g) => ({ ...acc, [g]: 0 }), {});
          users.forEach(u => {
            if (u.gender && stats.hasOwnProperty(u.gender)) stats[u.gender]++;
          });
        } else if (participantFilter === 'role') {
          // Use the custom 'role' field (job/position)
          stats = {};
          users.forEach(u => {
            const role = u.role && u.role.trim() ? u.role.trim() : 'Unknown';
            stats[role] = (stats[role] || 0) + 1;
          });
        } else if (participantFilter === 'age') {
          stats = AGE_RANGES.reduce((acc, r) => ({ ...acc, [r.label]: 0 }), {});
          users.forEach(u => {
            if (u.dateOfBirth) {
              const age = Math.floor((Date.now() - new Date(u.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
              const range = AGE_RANGES.find(r => age >= r.min && age <= r.max);
              if (range) stats[range.label]++;
            }
          });
        }
        setParticipantStats(stats);
      } catch (e) {
        setParticipantStats({});
      } finally {
        setParticipantLoading(false);
      }
    };
    if (events.length > 0) fetchParticipantStats();
  }, [events, participantFilter]);

  // Fetch admin-specific data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || (user.userType !== 'admin' && user.userType !== 'super_admin')) {
        return;
      }
      
      setAdminLoading(true);
      try {
        // Fetch requests
        const requestsRes = await fetch(`${BACKEND_URL}api/requests/all-requests`);
        const requestsData = await requestsRes.json();
        setRequests(requestsData);
        
        // Fetch all users
        const usersRes = await fetch(`${BACKEND_URL}api/auth/allusers`);
        const usersData = await usersRes.json();
        setUsers(usersData);
        
        // Calculate real system metrics from actual data
        const totalUsers = usersData.length;
        const totalEventsCount = events.length;
        const eventsWithExperts = events.filter(event => event.booked_experts && event.booked_experts.length > 0).length;
        const totalRequests = requestsData.length;
        
        // Calculate more accurate feature usage metrics
        const eventsWithRegistrations = events.filter(event => event.registeredUsers && event.registeredUsers.length > 0).length;
        const totalRegistrations = events.reduce((sum, event) => sum + (event.registeredUsers?.length || 0), 0);
        const pendingRequests = requestsData.filter(req => req.status === 'pending').length;
        
        setSystemMetrics({
          apiResponseTime: 0, // Would need real API monitoring
          errorRate: 0, // Would need real error tracking
          activeFeatures: [
            { name: 'Event Creation', usage: totalEventsCount },
            { name: 'User Registration', usage: totalUsers },
            { name: 'Expert Booking', usage: eventsWithExperts },
            { name: 'Request Management', usage: totalRequests },
            { name: 'Event Registrations', usage: totalRegistrations },
            { name: 'Pending Requests', usage: pendingRequests }
          ]
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setAdminLoading(false);
      }
    };
    
    fetchAdminData();
  }, [user]);

  // --- Doughnut Chart: Registration Status ---
  let fullyBooked = 0, partiallyBooked = 0, open = 0;
  events.forEach(event => {
    const regCount = event.registeredUsers?.length || 0;
    const totalSeats = regCount + (event.availableSeats ?? 0);
    if (event.availableSeats === 0 && regCount > 0) {
      fullyBooked++;
    } else if (regCount > 0 && regCount < totalSeats) {
      partiallyBooked++;
    } else {
      open++;
    }
  });
  const doughnutData = {
    labels: ['Fully Booked', 'Partially Booked', 'Open'],
    datasets: [
      {
        data: [fullyBooked, partiallyBooked, open],
        backgroundColor: ['#e51b00', '#ffc107', '#282769'],
        borderWidth: 2,
      },
    ],
  };

  // --- Line Chart: Events Created Over Time (by month) ---
  const eventsByMonth = {};
  events.forEach(event => {
    // Use event.createdAt for actual creation date, fallback to _id timestamp if createdAt doesn't exist
    let creationDate;
    if (event.createdAt) {
      creationDate = new Date(event.createdAt);
    } else if (event._id) {
      // Extract timestamp from ObjectId (first 4 bytes represent timestamp)
      const timestamp = parseInt(event._id.toString().substring(0, 8), 16) * 1000;
      creationDate = new Date(timestamp);
    } else {
      // Fallback to event.date if neither exists
      creationDate = new Date(event.date);
    }
    
    const key = `${creationDate.getFullYear()}-${String(creationDate.getMonth() + 1).padStart(2, '0')}`;
    eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
  });
  const sortedMonths = Object.keys(eventsByMonth).sort();
  const lineData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Events Created',
        data: sortedMonths.map(month => eventsByMonth[month]),
        fill: true,
        borderColor: '#282769',
        backgroundColor: 'rgba(40,39,105,0.1)',
        tension: 0.3,
      },
    ],
  };

  // --- Stacked Bar Chart: Registrations per Category ---
  const registrationsPerCategory = categoryLabels.map(cat =>
    events.reduce((sum, event) =>
      (Array.isArray(event.category) && event.category.includes(cat.value))
        ? sum + (event.registeredUsers?.length || 0)
        : sum
      , 0)
  );
  const stackedBarData = {
    labels: categoryLabels.map(cat => cat.label),
    datasets: [
      {
        label: 'Registrations',
        data: registrationsPerCategory,
        backgroundColor: ['#282769', '#e51b00', '#667eea', '#ffc107'],
        borderRadius: 8,
      },
    ],
  };

  // --- Horizontal Bar Chart: Top 5 Most Popular Events ---
  const topEvents = [...events]
    .sort((a, b) => (b.registeredUsers?.length || 0) - (a.registeredUsers?.length || 0))
    .slice(0, 5);
  const horizontalBarData = {
    labels: topEvents.map(e => e.title),
    datasets: [
      {
        label: 'Registrations',
        data: topEvents.map(e => e.registeredUsers?.length || 0),
        backgroundColor: '#e51b00',
        borderRadius: 8,
      },
    ],
  };

  // --- Existing Bar Chart: Events per Category ---
  const categoryCounts = categoryLabels.map(cat =>
    events.filter(event => Array.isArray(event.category) && event.category.includes(cat.value)).length
  );
  const totalEvents = events.length;
  const barData = {
    labels: categoryLabels.map(cat => cat.label),
    datasets: [
      {
        label: 'Number of Events',
        data: categoryCounts,
        backgroundColor: [
          '#282769',
          '#e51b00',
          '#667eea',
          '#ffc107'
        ],
        borderRadius: 8,
      },
    ],
  };

  // --- Admin-specific chart data ---
  
  // 1. Request Management Dashboard - Doughnut Chart
  const requestStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      data: [
        requests.filter(r => r.status === 'pending').length,
        requests.filter(r => r.status === 'approved').length,
        requests.filter(r => r.status === 'rejected').length
      ],
      backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
      borderWidth: 2,
    }],
  };

  // 2. System Performance Metrics - Line Chart for API Response Times
  // Comment for the next chart

  // 3. Most Active Features - Bar Chart
  const activeFeaturesData = {
    labels: systemMetrics.activeFeatures.map(f => f.name),
    datasets: [{
      label: 'Usage Count',
      data: systemMetrics.activeFeatures.map(f => f.usage),
      backgroundColor: ['#282769', '#e51b00', '#667eea', '#ffc107'],
      borderRadius: 8,
    }],
  };

  // 4. Event Management Analytics - Pie Chart for Event Categories
  const eventCategoriesData = {
    labels: categoryLabels.map(cat => cat.label),
    datasets: [{
      data: categoryLabels.map(cat =>
        events.filter(event => Array.isArray(event.category) && event.category.includes(cat.value)).length
      ),
      backgroundColor: ['#282769', '#e51b00', '#667eea', '#ffc107'],
      borderWidth: 2,
    }],
  };

  // 5. Event Attendance Rates - Bar Chart
  const eventAttendanceData = {
    labels: events.slice(0, 10).map(e => {
      // Truncate long event titles for better display
      const title = e.title || 'Untitled Event';
      return title.length > 20 ? title.substring(0, 20) + '...' : title;
    }),
    datasets: [{
      label: 'Attendance Rate (%)',
      data: events.slice(0, 10).map(e => {
        const totalSeats = (e.registeredUsers?.length || 0) + (e.availableSeats || 0);
        return totalSeats > 0 ? Math.round(((e.registeredUsers?.length || 0) / totalSeats) * 100) : 0;
      }),
      backgroundColor: '#28a745',
      borderColor: '#1e7e34',
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  // 6. Event Creation Trends - Line Chart
  // Calculate real event creation trends by month
  const eventCreationByMonth = {};
  const eventsWithExpertsByMonth = {};
  
  events.forEach(event => {
    // Use event.createdAt for actual creation date, fallback to _id timestamp if createdAt doesn't exist
    let creationDate;
    if (event.createdAt) {
      creationDate = new Date(event.createdAt);
    } else if (event._id) {
      // Extract timestamp from ObjectId (first 4 bytes represent timestamp)
      const timestamp = parseInt(event._id.toString().substring(0, 8), 16) * 1000;
      creationDate = new Date(timestamp);
    } else {
      // Fallback to event.date if neither exists
      creationDate = new Date(event.date);
    }
    
    const monthKey = `${creationDate.getFullYear()}-${String(creationDate.getMonth() + 1).padStart(2, '0')}`;
    eventCreationByMonth[monthKey] = (eventCreationByMonth[monthKey] || 0) + 1;
    
    if (event.booked_experts && event.booked_experts.length > 0) {
      eventsWithExpertsByMonth[monthKey] = (eventsWithExpertsByMonth[monthKey] || 0) + 1;
    }
  });
  
  // Get months based on filter
  let selectedMonths = [];
  const allMonths = Object.keys(eventCreationByMonth).sort();

  const currentYear = new Date().getFullYear();

  if (trendsFilter === 'last6') {
    // Always show July to December of current year
    selectedMonths = Array.from({ length: 6 }, (_, i) => `${currentYear}-${String(i + 7).padStart(2, '0')}`);
  } else if (trendsFilter === 'first6') {
    // Always show January to June of current year
    selectedMonths = Array.from({ length: 6 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, '0')}`);
  } else {
    selectedMonths = allMonths;
  }

  // Fallback: if no months, create a default month
  if (selectedMonths.length === 0) {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    selectedMonths = [currentMonth];
    eventCreationByMonth[currentMonth] = 0;
    eventsWithExpertsByMonth[currentMonth] = 0;
  }
  
  const eventCreationTrendsData = {
    labels: selectedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    }),
    datasets: [
      {
        label: 'Events Created',
        data: selectedMonths.map(month => eventCreationByMonth[month] || 0),
        borderColor: '#282769',
        backgroundColor: 'rgba(40, 39, 105, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Events with Experts',
        data: selectedMonths.map(month => eventsWithExpertsByMonth[month] || 0),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.3,
      }
    ],
  };

  // 7. Event Scheduling Patterns - Heatmap data (simplified as bar chart)
  // Calculate real scheduling patterns by day of week
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  events.forEach(event => {
    if (event.date) {
      const dayOfWeek = new Date(event.date).getDay();
      dayOfWeekCounts[dayOfWeek]++;
    }
  });
  
  const schedulingPatternsData = {
    labels: dayNames,
    datasets: [{
      label: 'Events Scheduled',
      data: dayOfWeekCounts,
      backgroundColor: '#ffc107',
      borderRadius: 8,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Events per Category',
        color: '#282769',
        font: { size: 20, weight: 'bold' },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Category', color: '#282769', font: { size: 16 } },
        ticks: { color: '#282769', font: { size: 14 } },
      },
      y: {
        title: { display: true, text: 'Number of Events', color: '#282769', font: { size: 16 } },
        beginAtZero: true,
        ticks: { color: '#282769', font: { size: 14 } },
        precision: 0,
      },
    },
  };

  return (
    <div className="events-stats-container">
      <button className="back-btn" onClick={() => navigate('/impact')} style={{marginBottom: '18px'}}>
        ← Back
      </button>
      <h2>Event Statistics</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="total-events">
            <span>Total Events Registered:</span>
            <span className="total-number">{totalEvents}</span>
          </div>

          {/* Admin-specific charts */}
          {(user?.userType === 'admin' || user?.userType === 'super_admin') && (
            <>
              <div className="admin-section">
                <h3>Admin Dashboard Analytics</h3>
                {adminLoading ? (
                  <div className="loading">Loading admin data...</div>
                ) : (
                  <div className="charts-grid">
                    {/* 1. Request Management Dashboard */}
                    <div className="chart-section">
                      <h3>Request Status Distribution</h3>
                      <Doughnut data={requestStatusData} style={{ maxWidth: 300, maxHeight: 300 }} />
                      <div className="chart-legend">
                        <span><span className="dot pending"></span>Pending: {requests.filter(r => r.status === 'pending').length}</span>
                        <span><span className="dot approved"></span>Approved: {requests.filter(r => r.status === 'approved').length}</span>
                        <span><span className="dot rejected"></span>Rejected: {requests.filter(r => r.status === 'rejected').length}</span>
                      </div>
                    </div>

                    {/* 3. Most Active Features */}
                    <div className="chart-section">
                      <h3>Most Active Features</h3>
                      <Bar data={activeFeaturesData} options={{
                        ...options,
                        plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Feature Usage Analytics' } },
                        scales: { ...options.scales, y: { ...options.scales.y, title: { ...options.scales.y.title, text: 'Usage Count' } } }
                      }} />
                    </div>

                    {/* 4. Event Categories Distribution */}
                    <div className="chart-section">
                      <h3>Event Categories Distribution</h3>
                      <Pie data={eventCategoriesData} style={{ maxWidth: 300, maxHeight: 300 }} />
                    </div>

                    {/* 5. Event Attendance Rates */}
                    <div className="chart-section">
                      <h3>Event Attendance Rates</h3>
                      <Bar data={eventAttendanceData} options={{
                        responsive: true,
                        plugins: { 
                          legend: { display: false },
                          title: { display: true, text: 'Top 10 Events by Attendance', color: '#282769', font: { size: 16, weight: 'bold' } }
                        },
                        scales: { 
                          x: { 
                            title: { display: true, text: 'Events', color: '#282769', font: { size: 14 } },
                            ticks: { 
                              color: '#282769', 
                              font: { size: 11 },
                              maxRotation: 45,
                              minRotation: 0
                            }
                          },
                          y: { 
                            title: { display: true, text: 'Attendance Rate (%)', color: '#282769', font: { size: 14 } },
                            beginAtZero: true,
                            max: 100,
                            ticks: { color: '#282769', font: { size: 12 } }
                          }
                        },
                        layout: {
                          padding: {
                            top: 20,
                            bottom: 20
                          }
                        }
                      }} />
                    </div>

                    {/* 6. Event Creation Trends */}
                    <div className="chart-section event-creation-trends">
                      <h3>Event Creation Trends</h3>
                      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                        <label htmlFor="trends-filter" style={{ marginRight: '10px', fontWeight: '600', color: '#282769' }}>
                          Time Period:
                        </label>
                        <select
                          id="trends-filter"
                          value={trendsFilter}
                          onChange={(e) => setTrendsFilter(e.target.value)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="last6">Last 6 Months</option>
                          <option value="first6">First 6 Months</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                      <Line data={eventCreationTrendsData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { display: true, position: 'top' }, 
                          title: { display: true, text: 'Event Creation Over Time', color: '#282769', font: { size: 16, weight: 'bold' } }
                        },
                        scales: { 
                          x: { 
                            title: { display: true, text: 'Month', color: '#282769', font: { size: 14 } },
                            ticks: { 
                              color: '#282769', 
                              font: { size: 10 },
                              maxRotation: 45,
                              minRotation: 0,
                              autoSkip: false,
                              maxTicksLimit: selectedMonths.length > 12 ? 12 : selectedMonths.length,
                              callback: function(value, index) {
                                // Show every month label
                                return this.getLabelForValue(value);
                              }
                            },
                            grid: {
                              display: true,
                              color: 'rgba(0,0,0,0.1)'
                            }
                          },
                          y: { 
                            title: { display: true, text: 'Number of Events', color: '#282769', font: { size: 14 } },
                            beginAtZero: true,
                            ticks: { 
                              color: '#282769', 
                              font: { size: 12 },
                              precision: 0,
                              stepSize: 1
                            },
                            grid: {
                              display: true,
                              color: 'rgba(0,0,0,0.1)'
                            }
                          }
                        },
                        layout: {
                          padding: {
                            top: 20,
                            bottom: 40,
                            left: 20,
                            right: 20
                          }
                        },
                        elements: {
                          point: {
                            radius: 4,
                            hoverRadius: 6
                          },
                          line: {
                            tension: 0.3
                          }
                        }
                      }} />
                    </div>

                    {/* 7. Event Scheduling Patterns */}
                    <div className="chart-section">
                      <h3>Event Scheduling Patterns</h3>
                      <Bar data={schedulingPatternsData} options={{
                        ...options,
                        plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Events by Day of Week' } },
                        scales: { ...options.scales, y: { ...options.scales.y, title: { ...options.scales.y.title, text: 'Number of Events' } } }
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Existing charts for all users */}
          <div className="charts-grid">
            <div className="chart-section">
              <h3>Doughnut Chart: Registration Status</h3>
              <div className="doughnut-row">
                <Doughnut data={doughnutData} style={{ maxWidth: 180, maxHeight: 180 }} />
                <div className="doughnut-numbers">
                  <span><span className="dot fully"></span>Fully Booked: {fullyBooked}</span>
                  <span><span className="dot partial"></span>Partially Booked: {partiallyBooked}</span>
                  <span><span className="dot open"></span>Open: {open}</span>
                </div>
              </div>
            </div>
            <div className="chart-section">
              <h3>Line Chart: Events Created Over Time</h3>
              <Line data={lineData} />
            </div>
            <div className="chart-section">
              <h3>Stacked Bar Chart: Registrations per Category</h3>
              <Bar data={stackedBarData} options={{ ...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Registrations per Category' } } }} />
            </div>
            <div className="chart-section">
              <h3>Horizontal Bar Chart: Top 5 Most Popular Events</h3>
              <Bar data={horizontalBarData} options={{
                indexAxis: 'y',
                ...options,
                plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Top 5 Most Popular Events' } },
              }} />
            </div>
          </div>

          <div className="bottom-charts-row">
            <div className="bar-chart-section">
              <Bar data={barData} options={options} className="chart-canvas" />
            </div>
            <div className="role-pie-section">
              <h3>Participants Demographics</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <label htmlFor="participant-filter">Participant Ratio by:</label>
                <select
                  id="participant-filter"
                  value={participantFilter}
                  onChange={e => setParticipantFilter(e.target.value)}
                  style={{ fontSize: 16, padding: '4px 10px', borderRadius: 6 }}
                >
                  <option value="gender">Gender</option>
                  <option value="role">Role</option>
                  <option value="age">Age Range</option>
                </select>
              </div>
              {participantLoading ? (
                <div className="loading">Loading participant data...</div>
              ) : (
                (() => {
                  if (participantFilter === 'gender') {
                    const genderLabels = ['Male', 'Female', 'Other'];
                    const genderData = [participantStats.male || 0, participantStats.female || 0, participantStats.other || 0];
                    const genderColors = ['#4a90e2', '#e51b00', '#ffc107'];
                    return <Pie data={{ labels: genderLabels, datasets: [{ data: genderData, backgroundColor: genderColors, borderWidth: 2 }] }} className="chart-canvas" />;
                  } else if (participantFilter === 'age') {
                    const ageLabels = AGE_RANGES.map(r => r.label);
                    const ageData = ageLabels.map(l => participantStats[l] || 0);
                    const ageColors = ['#4a90e2', '#e51b00', '#ffc107', '#667eea', '#282769'];
                    return <Pie data={{ labels: ageLabels, datasets: [{ data: ageData, backgroundColor: ageColors, borderWidth: 2 }] }} className="chart-canvas" />;
                  } else if (participantFilter === 'role') {
                    // Pie chart for role, group >4 as 'Other'
                    let roleLabels = [];
                    let roleData = [];
                    let roleColors = [];
                    if (Object.keys(participantStats).length > 0) {
                      const sortedRoles = Object.entries(participantStats).sort((a, b) => b[1] - a[1]);
                      const topRoles = sortedRoles.slice(0, 4);
                      const otherCount = sortedRoles.slice(4).reduce((sum, [, count]) => sum + count, 0);
                      roleLabels = topRoles.map(([role]) => role);
                      roleData = topRoles.map(([, count]) => count);
                      roleColors = ['#282769', '#e51b00', '#ffc107', '#667eea'];
                      if (otherCount > 0) {
                        roleLabels.push('Other');
                        roleData.push(otherCount);
                        roleColors.push('#bdbdbd');
                      }
                    }
                    return <Pie data={{ labels: roleLabels, datasets: [{ data: roleData, backgroundColor: roleColors, borderWidth: 2 }] }} className="chart-canvas" />;
                  }
                  return null;
                })()
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventsStats; 
 