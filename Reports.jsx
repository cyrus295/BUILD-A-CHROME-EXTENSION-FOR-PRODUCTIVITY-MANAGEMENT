import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use useCallback to memoize the function
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/activity/report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]); // Add dependencies

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]); // Now fetchReportData is stable

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  // Rest of the component remains the same...
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const categoryData = {
    labels: reportData?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Time Spent (hours)',
        data: reportData?.map(item => (item.totalTime / 3600).toFixed(1)) || [],
        backgroundColor: [
          '#27ae60',
          '#3498db',
          '#e74c3c'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>Productivity Reports</h1>
        <p>Analyze your browsing habits and productivity trends</p>
      </header>

      <div className="date-filter">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
          />
        </div>
        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
          />
        </div>
        <button onClick={fetchReportData} className="generate-btn">
          Generate Report
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading report data...</div>
      ) : reportData ? (
        <div className="reports-grid">
          <div className="report-card summary">
            <h3>Time Summary</h3>
            <div className="summary-stats">
              {reportData.map((category, index) => (
                <div key={index} className="summary-item">
                  <span className={`category-badge ${category._id}`}>
                    {category._id}
                  </span>
                  <span className="time">{formatTime(category.totalTime)}</span>
                  <span className="sessions">{category.sessions} sessions</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-card chart">
            <h3>Time Distribution</h3>
            <div className="chart-container">
              <Doughnut 
                data={categoryData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="report-card insights">
            <h3>Productivity Insights</h3>
            <div className="insights-list">
              <div className="insight-item">
                <span className="insight-icon">📊</span>
                <div className="insight-content">
                  <strong>Total Tracked Time:</strong>
                  <span>{formatTime(reportData.reduce((total, cat) => total + cat.totalTime, 0))}</span>
                </div>
              </div>
              <div className="insight-item">
                <span className="insight-icon">🎯</span>
                <div className="insight-content">
                  <strong>Productivity Ratio:</strong>
                  <span>
                    {((reportData.find(cat => cat._id === 'productive')?.totalTime || 0) / 
                      reportData.reduce((total, cat) => total + cat.totalTime, 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="insight-item">
                <span className="insight-icon">⏰</span>
                <div className="insight-content">
                  <strong>Average Session:</strong>
                  <span>
                    {formatTime(reportData.reduce((total, cat) => total + cat.totalTime, 0) / 
                     reportData.reduce((total, cat) => total + cat.sessions, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>No report data available for the selected period.</p>
        </div>
      )}
    </div>
  );
}

export default Reports;