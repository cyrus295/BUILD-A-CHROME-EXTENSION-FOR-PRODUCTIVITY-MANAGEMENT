// Content script for additional website monitoring

// Track user activity (scroll, clicks, typing) to determine engagement
let lastActivityTime = Date.now();
let isUserActive = true;

function updateActivity() {
    lastActivityTime = Date.now();
    if (!isUserActive) {
        isUserActive = true;
        // Notify background script that user became active
        chrome.runtime.sendMessage({
            type: 'USER_ACTIVITY_CHANGED',
            isActive: true
        });
    }
}

// Add event listeners for user activity
document.addEventListener('mousemove', updateActivity);
document.addEventListener('keydown', updateActivity);
document.addEventListener('click', updateActivity);
document.addEventListener('scroll', updateActivity);

// Check for inactivity every 30 seconds
setInterval(() => {
    const inactiveTime = Date.now() - lastActivityTime;
    if (inactiveTime > 30000 && isUserActive) { // 30 seconds
        isUserActive = false;
        chrome.runtime.sendMessage({
            type: 'USER_ACTIVITY_CHANGED',
            isActive: false
        });
    }
}, 5000);

// Send page load information to background script
chrome.runtime.sendMessage({
    type: 'PAGE_LOADED',
    url: window.location.href,
    title: document.title,
    timestamp: Date.now()
});