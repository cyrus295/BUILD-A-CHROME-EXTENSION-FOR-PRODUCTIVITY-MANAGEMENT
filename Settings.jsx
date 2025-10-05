import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    workHours: { start: '09:00', end: '17:00' },
    breakReminders: true,
    dailyGoals: 6
  });
  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState({ domain: '', category: 'social' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserPreferences();
    fetchBlockedSites();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      // In a real app, you'd fetch this from the backend
      // For now, we'll use the user data from context
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchBlockedSites = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/blocked-sites');
      setBlockedSites(response.data);
    } catch (error) {
      console.error('Error fetching blocked sites:', error);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWorkHoursChange = (type, value) => {
    setPreferences(prev => ({
      ...prev,
      workHours: {
        ...prev.workHours,
        [type]: value
      }
    }));
  };

  const savePreferences = async () => {
    try {
      // In a real app, you'd send this to the backend
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving preferences');
      console.error('Error saving preferences:', error);
    }
  };

  const addBlockedSite = async () => {
    if (!newSite.domain) {
      setMessage('Please enter a domain');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/blocked-sites', newSite);
      setBlockedSites(prev => [...prev, response.data]);
      setNewSite({ domain: '', category: 'social' });
      setMessage('Site blocked successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error blocking site');
      console.error('Error blocking site:', error);
    }
  };

  const removeBlockedSite = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/blocked-sites/${id}`);
      setBlockedSites(prev => prev.filter(site => site._id !== id));
      setMessage('Site unblocked successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error unblocking site');
      console.error('Error unblocking site:', error);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Customize your productivity tracking experience</p>
      </header>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-section">
          <h3>User Profile</h3>
          <div className="profile-info">
            <div className="info-item">
              <label>Username:</label>
              <span>{user?.username}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Work Preferences</h3>
          <div className="preferences-form">
            <div className="form-group">
              <label>Work Hours</label>
              <div className="time-inputs">
                <input
                  type="time"
                  value={preferences.workHours.start}
                  onChange={(e) => handleWorkHoursChange('start', e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  value={preferences.workHours.end}
                  onChange={(e) => handleWorkHoursChange('end', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.breakReminders}
                  onChange={(e) => handlePreferenceChange('breakReminders', e.target.checked)}
                />
                Enable break reminders
              </label>
            </div>

            <div className="form-group">
              <label>Daily Productivity Goal (hours)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={preferences.dailyGoals}
                onChange={(e) => handlePreferenceChange('dailyGoals', parseInt(e.target.value))}
              />
            </div>

            <button onClick={savePreferences} className="save-btn">
              Save Preferences
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Blocked Websites</h3>
          <div className="blocked-sites-form">
            <div className="add-site">
              <input
                type="text"
                placeholder="Enter domain (e.g., facebook.com)"
                value={newSite.domain}
                onChange={(e) => setNewSite(prev => ({ ...prev, domain: e.target.value }))}
              />
              <select
                value={newSite.category}
                onChange={(e) => setNewSite(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="social">Social Media</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
              <button onClick={addBlockedSite} className="add-btn">
                Block Site
              </button>
            </div>

            <div className="blocked-list">
              {blockedSites.map(site => (
                <div key={site._id} className="blocked-item">
                  <span className="domain">{site.domain}</span>
                  <span className={`category ${site.category}`}>{site.category}</span>
                  <button 
                    onClick={() => removeBlockedSite(site._id)}
                    className="remove-btn"
                  >
                    Unblock
                  </button>
                </div>
              ))}
              {blockedSites.length === 0 && (
                <p className="no-sites">No websites blocked yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;