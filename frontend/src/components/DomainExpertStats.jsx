import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie, Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import '../components/EventsStats.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

const DOMAIN_LABELS = [
  { value: 'ip_consultancy', label: 'IP Consultancy', color: '#282769' },
  { value: 'company_registration', label: 'Company Registration', color: '#e51b00' },
  { value: 'mentoring', label: 'Mentoring', color: '#667eea' },
  { value: 'expert_guidance', label: 'Expert Guidance', color: '#ffc107' }
];

const DomainExpertStats = () => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all domain experts
        const expertsRes = await fetch(`${BACKEND_URL}api/user/domain-experts`);
        const expertsData = await expertsRes.json();
        setExperts(expertsData);
        // Fetch all events (or sessions)
        const eventsRes = await fetch(`${BACKEND_URL}api/events`);
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      } catch (e) {
        setExperts([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. Pie Chart: Domain Experts by Domain
  // Dynamically aggregates experts by their 'Domain' field from the fetched user data.
  const domainCounts = experts.reduce((acc, expert) => {
    const domain = expert.Domain || 'Not Specified'; // Fallback for experts without a domain
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  // A map for quick lookup of domain labels and colors
  const domainInfoMap = DOMAIN_LABELS.reduce((acc, { value, label, color }) => {
    acc[value] = { label, color };
    return acc;
  }, {});

  // Function to generate a random color for domains not in our predefined list
  const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

  const domainPieData = {
    labels: Object.keys(domainCounts).map(domainValue => 
      // Use predefined label or format the value
      domainInfoMap[domainValue]?.label || domainValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [{
      data: Object.values(domainCounts),
      backgroundColor: Object.keys(domainCounts).map(domainValue => 
        // Use predefined color or a random one
        domainInfoMap[domainValue]?.color || getRandomColor()
      ),
      borderWidth: 2,
    }],
  };

  // 2. Bar Chart: Top Experts by Sessions/Events
  // Count events per expert (by expert _id in booked_experts)
  const expertEventCounts = {};
  events.forEach(ev => {
    (ev.booked_experts || []).forEach(exId => {
      expertEventCounts[exId] = (expertEventCounts[exId] || 0) + 1;
    });
  });
  const topExperts = experts
    .map(ex => ({
      ...ex,
      eventCount: expertEventCounts[ex._id] || 0
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 10);
  const topExpertBarData = {
    labels: topExperts.map(ex => ex.name),
    datasets: [
      {
        label: 'Sessions/Events Conducted',
        data: topExperts.map(ex => ex.eventCount),
        backgroundColor: '#282769',
        borderRadius: 8,
      },
    ],
  };

  // 3. Stacked Bar Chart: Sessions/Events by Domain Over Time (by month)
  // Group events by month and domain
  const eventsByMonthDomain = {};
  events.forEach(ev => {
    if (!ev.date) return;
    const d = new Date(ev.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    DOMAIN_LABELS.forEach(dom => {
      if (Array.isArray(ev.category) && ev.category.includes(dom.value)) {
        if (!eventsByMonthDomain[monthKey]) eventsByMonthDomain[monthKey] = {};
        eventsByMonthDomain[monthKey][dom.value] = (eventsByMonthDomain[monthKey][dom.value] || 0) + 1;
      }
    });
  });
  const months = Object.keys(eventsByMonthDomain).sort();
  const stackedBarData = {
    labels: months,
    datasets: DOMAIN_LABELS.map(dom => ({
      label: dom.label,
      data: months.map(m => eventsByMonthDomain[m]?.[dom.value] || 0),
      backgroundColor: dom.color,
      stack: 'stack1',
    })),
  };

  // 4. Domain Popularity Trends (Line Chart)
  const domainPopularityLineData = {
    labels: months,
    datasets: DOMAIN_LABELS.map(dom => ({
      label: dom.label,
      data: months.map(m => eventsByMonthDomain[m]?.[dom.value] || 0),
      borderColor: dom.color,
      backgroundColor: dom.color, // For points and legend
      fill: false,
      tension: 0.4,
    })),
  };

  // 5. Line Chart: New Domain Experts Joined Over Time
  const expertsByMonth = {};
  experts.forEach(ex => {
    if (!ex.createdAt) return;
    const d = new Date(ex.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    expertsByMonth[monthKey] = (expertsByMonth[monthKey] || 0) + 1;
  });
  const expertMonths = Object.keys(expertsByMonth).sort();
  const lineData = {
    labels: expertMonths,
    datasets: [
      {
        label: 'New Experts Joined',
        data: expertMonths.map(m => expertsByMonth[m]),
        fill: true,
        borderColor: '#e51b00',
        backgroundColor: 'rgba(229,27,0,0.1)',
        tension: 0.3,
      },
    ],
  };

  // 6. Heatmap of Expert Activity
  const today = new Date();
  const aYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  
  const eventCountsByDate = events.reduce((acc, event) => {
    if (!event.date) return acc;
    const eventDate = new Date(event.date);
    // Only include dates within the last year for the heatmap
    if (eventDate >= aYearAgo && eventDate <= today) {
      const dateString = eventDate.toISOString().slice(0, 10);
      acc[dateString] = (acc[dateString] || 0) + 1;
    }
    return acc;
  }, {});

  const heatmapValues = Object.keys(eventCountsByDate).map(date => ({
    date: new Date(date),
    count: eventCountsByDate[date],
  }));

  return (
    <div className="events-stats-container domain-expert-stats-container">
      <button className="back-btn" onClick={() => navigate('/impact')} style={{marginBottom: '18px'}}>
        ← Back
      </button>
      <h2>Domain Expert Statistics</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="charts-grid">
            <div className="chart-section">
              <h3>Experts by Domain</h3>
              <Pie data={domainPieData} className="chart-canvas" />
            </div>
            <div className="chart-section">
              <h3>Top Experts by Sessions/Events</h3>
              <Bar data={topExpertBarData} className="chart-canvas" />
            </div>
            <div className="chart-section">
              <h3>Sessions/Events by Domain Over Time</h3>
              <Bar data={stackedBarData} options={{
                plugins: { legend: { position: 'top' } },
                responsive: true,
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
              }} className="chart-canvas" />
            </div>
            <div className="chart-section">
              <h3>Domain Popularity Trends</h3>
              <Line data={domainPopularityLineData} options={{
                plugins: { legend: { position: 'top' } },
                responsive: true,
                scales: { y: { beginAtZero: true } },
              }} className="chart-canvas" />
            </div>
            <div className="chart-section">
              <h3>New Experts Joined Over Time</h3>
              <Line data={lineData} className="chart-canvas" />
            </div>
          </div>
          <div className="chart-section heatmap-section">
            <h3>Expert Session Activity (Last Year)</h3>
            <CalendarHeatmap
              startDate={aYearAgo}
              endDate={today}
              values={heatmapValues}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
              tooltipDataAttrs={value => ({
                'data-tip': value.date ? `${value.date.toDateString()}: ${value.count} sessions` : 'No sessions'
              })}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DomainExpertStats;
