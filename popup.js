let isTracking = true;
let currentTab = null;

// DOM elements
const statusElement = document.getElementById('status');
const currentSiteElement = document.getElementById('currentSite');
const timeSpentElement = document.getElementById('timeSpent');
const toggleTrackingBtn = document.getElementById('toggleTracking');
const openDashboardBtn = document.getElementById('openDashboard');
const productiveTimeElement = document.getElementById('productiveTime');
const distractingTimeElement = document.getElementById('distractingTime');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentTab();
    await loadTrackingStatus();
    await loadTodayStats();
    startTimeUpdate();
});

async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab && tab.url) {
        const url = new URL(tab.url);
        currentSiteElement.textContent = url.hostname;
        
        // Get time spent on current site
        const result = await chrome.storage.local.get(['currentSession']);
        if (result.currentSession && result.currentSession.domain === url.hostname) {
            updateTimeDisplay(result.currentSession.startTime);
        }
    }
}

async function loadTrackingStatus() {
    const result = await chrome.storage.local.get(['isTracking']);
    isTracking = result.isTracking !== false; // Default to true
    updateTrackingUI();
}

function updateTrackingUI() {
    if (isTracking) {
        statusElement.textContent = 'Tracking...';
        statusElement.className = 'status tracking';
        toggleTrackingBtn.textContent = 'Pause Tracking';
    } else {
        statusElement.textContent = 'Paused';
        statusElement.className = 'status paused';
        toggleTrackingBtn.textContent = 'Resume Tracking';
    }
}

function startTimeUpdate() {
    setInterval(async () => {
        const result = await chrome.storage.local.get(['currentSession']);
        if (result.currentSession) {
            updateTimeDisplay(result.currentSession.startTime);
        }
    }, 1000);
}

function updateTimeDisplay(startTime) {
    const now = Date.now();
    const diff = now - startTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    timeSpentElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function loadTodayStats() {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['dailyStats']);
    const dailyStats = result.dailyStats || {};
    const todayStats = dailyStats[today] || { productive: 0, distracting: 0 };
    
    productiveTimeElement.textContent = formatTime(todayStats.productive);
    distractingTimeElement.textContent = formatTime(todayStats.distracting);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// Event listeners
toggleTrackingBtn.addEventListener('click', async () => {
    isTracking = !isTracking;
    await chrome.storage.local.set({ isTracking });
    updateTrackingUI();
    
    // Notify background script
    chrome.runtime.sendMessage({
        type: 'TRACKING_TOGGLED',
        isTracking: isTracking
    });
});

openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});