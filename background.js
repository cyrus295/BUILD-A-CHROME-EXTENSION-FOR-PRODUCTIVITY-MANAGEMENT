// Background service worker for productivity tracker

let currentSession = null;
let isTracking = true;
const API_BASE = 'http://localhost:5000/api';

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Productivity Tracker installed');
    chrome.storage.local.set({ isTracking: true });
    startTracking();
});

// Listen for tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (isTracking) {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (tab.url) {
                handleTabChange(tab);
            }
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isTracking) {
        handleTabChange(tab);
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'TRACKING_TOGGLED':
            isTracking = request.isTracking;
            if (isTracking) {
                startTracking();
            } else {
                endCurrentSession();
            }
            break;
            
        case 'GET_CURRENT_SESSION':
            sendResponse({ currentSession, isTracking });
            break;
    }
});

function handleTabChange(tab) {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
    }

    const url = new URL(tab.url);
    const domain = url.hostname;
    
    endCurrentSession();
    startNewSession(domain, tab.url, tab.id);
}

function startNewSession(domain, url, tabId) {
    if (!isTracking) return;

    currentSession = {
        domain,
        url,
        tabId,
        startTime: Date.now(),
        category: categorizeWebsite(domain)
    };

    chrome.storage.local.set({ currentSession });

    // Check if site is blocked
    checkIfBlocked(domain).then(isBlocked => {
        if (isBlocked) {
            blockSite(tabId, domain);
        }
    });

    console.log(`Started tracking: ${domain}`);
}

function endCurrentSession() {
    if (!currentSession) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - currentSession.startTime) / 1000); // in seconds

    // Save session to storage and backend
    saveSession(currentSession, endTime, duration);
    
    // Update daily stats
    updateDailyStats(currentSession.category, duration);

    currentSession = null;
    chrome.storage.local.remove(['currentSession']);
}

function saveSession(session, endTime, duration) {
    // Save to local storage for offline use
    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        sessions.push({
            ...session,
            endTime,
            duration
        });
        chrome.storage.local.set({ sessions: sessions.slice(-100) }); // Keep last 100 sessions
    });

    // Send to backend if user is authenticated
    chrome.storage.local.get(['authToken'], async (result) => {
        if (result.authToken) {
            try {
                const response = await fetch(`${API_BASE}/activity`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.authToken}`
                    },
                    body: JSON.stringify({
                        website: session.url,
                        domain: session.domain,
                        startTime: new Date(session.startTime),
                        endTime: new Date(endTime),
                        duration: duration,
                        category: session.category
                    })
                });

                if (!response.ok) {
                    console.error('Failed to save activity to backend');
                }
            } catch (error) {
                console.error('Error saving activity:', error);
            }
        }
    });
}

function updateDailyStats(category, duration) {
    const today = new Date().toDateString();
    
    chrome.storage.local.get(['dailyStats'], (result) => {
        const dailyStats = result.dailyStats || {};
        const todayStats = dailyStats[today] || { productive: 0, distracting: 0, neutral: 0 };
        
        todayStats[category] = (todayStats[category] || 0) + duration;
        dailyStats[today] = todayStats;
        
        chrome.storage.local.set({ dailyStats });
    });
}

function categorizeWebsite(domain) {
    const productiveSites = [
        'github.com', 'stackoverflow.com', 'docs.google.com',
        'notion.so', 'trello.com', 'slack.com', 'teams.microsoft.com'
    ];
    
    const distractingSites = [
        'youtube.com', 'netflix.com', 'facebook.com', 'instagram.com',
        'twitter.com', 'reddit.com', 'tiktok.com'
    ];
    
    if (productiveSites.some(site => domain.includes(site))) {
        return 'productive';
    } else if (distractingSites.some(site => domain.includes(site))) {
        return 'distracting';
    } else {
        return 'neutral';
    }
}

async function checkIfBlocked(domain) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['blockedSites', 'authToken'], async (result) => {
            // Check local storage first
            const blockedSites = result.blockedSites || [];
            const isBlockedLocally = blockedSites.some(site => domain.includes(site.domain));
            
            if (isBlockedLocally) {
                resolve(true);
                return;
            }

            // Check backend if authenticated
            if (result.authToken) {
                try {
                    const response = await fetch(`${API_BASE}/blocked-sites`, {
                        headers: {
                            'Authorization': `Bearer ${result.authToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const backendBlockedSites = await response.json();
                        const isBlocked = backendBlockedSites.some(site => domain.includes(site.domain));
                        
                        // Update local storage
                        chrome.storage.local.set({ blockedSites: backendBlockedSites });
                        resolve(isBlocked);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching blocked sites:', error);
                }
            }
            
            resolve(false);
        });
    });
}

function blockSite(tabId, domain) {
    chrome.tabs.update(tabId, { 
        url: chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(domain)}`)
    });
    
    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Site Blocked',
        message: `${domain} has been blocked for better productivity`
    });
}

function startTracking() {
    // Get current active tab and start tracking
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            handleTabChange(tabs[0]);
        }
    });
}