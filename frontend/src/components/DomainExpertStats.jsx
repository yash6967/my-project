import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie, Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useUser } from '../context/UserContext';
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
  const { user } = useUser();
  const [experts, setExperts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin-specific state
  const [adminLoading, setAdminLoading] = useState(false);
  const [expertSessionsData, setExpertSessionsData] = useState([]);
  const [activeExpertsData, setActiveExpertsData] = useState([]);

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

  // Fetch admin-specific data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || (user.userType !== 'admin' && user.userType !== 'super_admin')) {
        return;
      }
      
      setAdminLoading(true);
      try {
        // Process expert sessions data
        const expertSessions = experts.map(expert => {
          const sessionsCount = events.filter(event => 
            event.booked_experts && 
            event.booked_experts.some(bookedExpert => 
              bookedExpert._id === expert._id || bookedExpert === expert._id
            )
          ).length;
          
          return {
            ...expert,
            sessionsCount,
            isActive: sessionsCount > 0
          };
        });

        // Sort by sessions count for the sessions chart
        const sortedBySessions = [...expertSessions].sort((a, b) => b.sessionsCount - a.sessionsCount);
        setExpertSessionsData(sortedBySessions);

        // Filter active experts (those with at least 1 session in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeExperts = expertSessions.filter(expert => {
          const recentSessions = events.filter(event => {
            if (!event.date) return false;
            const eventDate = new Date(event.date);
            return eventDate >= thirtyDaysAgo && 
                   event.booked_experts && 
                   event.booked_experts.some(bookedExpert => 
                     bookedExpert._id === expert._id || bookedExpert === expert._id
                   );
          });
          return recentSessions.length > 0;
        });
        
        setActiveExpertsData(activeExperts);
      } catch (error) {
        console.error('Error processing admin data:', error);
      } finally {
        setAdminLoading(false);
      }
    };
    
    fetchAdminData();
  }, [user, experts, events]);

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

  // Admin-specific chart data
  // 1. Domain Experts According to Sessions Taken
  const expertSessionsChartData = {
    labels: expertSessionsData.slice(0, 15).map(expert => expert.name),
    datasets: [
      {
        label: 'Sessions Conducted',
        data: expertSessionsData.slice(0, 15).map(expert => expert.sessionsCount),
        backgroundColor: '#282769',
        borderRadius: 8,
        borderColor: '#1a1a4a',
        borderWidth: 2,
      },
    ],
  };

  // 2. Active Domain Experts by Domain
  const activeExpertsByDomain = activeExpertsData.reduce((acc, expert) => {
    const domain = expert.Domain || 'Not Specified';
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  const activeExpertsPieData = {
    labels: Object.keys(activeExpertsByDomain).map(domainValue => 
      domainInfoMap[domainValue]?.label || domainValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [{
      data: Object.values(activeExpertsByDomain),
      backgroundColor: Object.keys(activeExpertsByDomain).map(domainValue => 
        domainInfoMap[domainValue]?.color || getRandomColor()
      ),
      borderWidth: 2,
    }],
  };

  // 3. Active vs Inactive Experts Comparison
  const activeCount = activeExpertsData.length;
  const inactiveCount = experts.length - activeCount;
  const activeInactiveData = {
    labels: ['Active Experts', 'Inactive Experts'],
    datasets: [{
      data: [activeCount, inactiveCount],
      backgroundColor: ['#28a745', '#6c757d'],
      borderWidth: 2,
    }],
  };

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
          {/* Admin-specific sections - Moved to top */}
          {(user?.userType === 'admin' || user?.userType === 'super_admin') && (
            <>
              <div className="admin-section">
                <h3>Admin Analytics - Domain Expert Performance</h3>
                {adminLoading ? (
                  <div className="loading">Loading admin data...</div>
                ) : (
                  <div className="charts-grid">
                    {/* 1. Domain Experts According to Sessions Taken */}
                    <div className="chart-section">
                      <h3>Top Domain Experts by Sessions Conducted</h3>
                      <Bar 
                        data={expertSessionsChartData} 
                        options={{
                          plugins: { 
                            legend: { position: 'top' },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Sessions: ${context.parsed.y}`;
                                }
                              }
                            }
                          },
                          responsive: true,
                          scales: { 
                            y: { 
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Sessions'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Domain Experts'
                              }
                            }
                          },
                        }} 
                        className="chart-canvas" 
                      />
                      <div className="chart-legend">
                        <span>Total Experts: {experts.length}</span>
                        <span>Experts with Sessions: {expertSessionsData.filter(ex => ex.sessionsCount > 0).length}</span>
                      </div>
                    </div>

                    {/* 2. Active Domain Experts by Domain */}
                    <div className="chart-section">
                      <h3>Active Domain Experts by Domain</h3>
                      <Pie 
                        data={activeExpertsPieData} 
                        options={{
                          plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                        className="chart-canvas" 
                      />
                      <div className="chart-legend">
                        <span>Active Experts: {activeExpertsData.length}</span>
                        <span>Total Experts: {experts.length}</span>
                      </div>
                    </div>

                    {/* 3. Active vs Inactive Experts */}
                    <div className="chart-section">
                      <h3>Active vs Inactive Domain Experts</h3>
                      <Pie 
                        data={activeInactiveData} 
                        options={{
                          plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                        className="chart-canvas" 
                      />
                      <div className="chart-legend">
                        <span><span className="dot active"></span>Active: {activeCount}</span>
                        <span><span className="dot inactive"></span>Inactive: {inactiveCount}</span>
                      </div>
                    </div>

                    {/* 4. Active Experts Performance Summary */}
                    <div className="chart-section">
                      <h3>Active Experts Performance Summary</h3>
                      <div className="performance-summary">
                        <div className="summary-card">
                          <h4>Most Active Expert</h4>
                          <p>{expertSessionsData[0]?.name || 'N/A'}</p>
                          <span>{expertSessionsData[0]?.sessionsCount || 0} sessions</span>
                        </div>
                        <div className="summary-card">
                          <h4>Average Sessions per Expert</h4>
                          <p>{expertSessionsData.length > 0 ? (expertSessionsData.reduce((sum, expert) => sum + expert.sessionsCount, 0) / expertSessionsData.length).toFixed(1) : 0}</p>
                        </div>
                        <div className="summary-card">
                          <h4>Active Rate</h4>
                          <p>{experts.length > 0 ? ((activeCount / experts.length) * 100).toFixed(1) : 0}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

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
 
