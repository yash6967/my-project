import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantFilter, setParticipantFilter] = useState('gender');
  const [participantStats, setParticipantStats] = useState({});
  const [participantLoading, setParticipantLoading] = useState(false);

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
    if (event.date) {
      const d = new Date(event.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
    }
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
