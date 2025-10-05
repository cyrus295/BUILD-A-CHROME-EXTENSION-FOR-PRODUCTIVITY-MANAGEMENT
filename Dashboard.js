import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [todayStats, setTodayStats] = useState({ productive: 0, distracting: 0, neutral: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's activities
      const activitiesResponse = await axios.get(`http://localhost:5000/api/activity?date=${today}`);
      const activities = activitiesResponse.data;
      
      // Calculate today's stats
      const stats = { productive: 0, distracting: 0, neutral: 0 };
      activities.forEach(activity => {
        stats[activity.category] += activity.duration;
      });
      setTodayStats(stats);
      setRecentActivities(activities.slice(0, 10));

      // Fetch weekly report
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const reportResponse = await axios.get(
        `http://localhost:5000/api/activity/report?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`
      );
      setWeeklyData(reportResponse.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const doughnutData = {
    labels: ['Productive', 'Neutral', 'Distracting'],
    datasets: [
      {
        data: [todayStats.productive, todayStats.neutral, todayStats.distracting],
        backgroundColor: ['#27ae60', '#3498db', '#e74c3c'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const barData = {
    labels: weeklyData.map(item => item._id),
    datasets: [
      {
        label: 'Time (hours)',
        data: weeklyData.map(item => (item.totalTime / 3600).toFixed(1)),
        backgroundColor: '#3498db'
      }
    ]
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Productivity Dashboard</h1>
        <p>Track your time and improve focus</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card productive">
          <h3>Productive Time</h3>
          <div className="stat-value">{formatTime(todayStats.productive)}</div>
          <div className="stat-label">Today</div>
        </div>
        
        <div className="stat-card neutral">
          <h3>Neutral Time</h3>
          <div className="stat-value">{formatTime(todayStats.neutral)}</div>
          <div className="stat-label">Today</div>
        </div>
        
        <div className="stat-card distracting">
          <h3>Distracting Time</h3>
          <div className="stat-value">{formatTime(todayStats.distracting)}</div>
          <div className="stat-label">Today</div>
        </div>
        
        <div className="stat-card total">
          <h3>Total Tracked</h3>
          <div className="stat-value">
            {formatTime(todayStats.productive + todayStats.neutral + todayStats.distracting)}
          </div>
          <div className="stat-label">Today</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Today's Distribution</h3>
          <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
        </div>
        
        <div className="chart-card">
          <h3>Weekly Overview</h3>
          <Bar data={barData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="recent-activities">
        <h3>Recent Activities</h3>
        <div className="activities-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-domain">{activity.domain}</div>
              <div className={`activity-category ${activity.category}`}>
                {activity.category}
              </div>
              <div className="activity-duration">
                {formatTime(activity.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;