// Fixed event-status.js - Handle static hosting environment
async function loadEventStatus() {
    const statusElement = document.getElementById('event-status');
    if (!statusElement) return;

    try {
        // Since this is a static site, use local event logic instead of API
        const eventData = getLocalEventData();

        // Update the status display
        statusElement.innerHTML = `
            <div class="text-${eventData.isActive ? 'green' : 'blue'}-600">
                <strong>Event Status:</strong> ${eventData.status}
                <br>
                <span class="text-sm">${eventData.message}</span>
            </div>
        `;
        statusElement.className = `text-center mb-4 p-3 bg-${eventData.isActive ? 'green' : 'blue'}-50 rounded-lg border border-${eventData.isActive ? 'green' : 'blue'}-200`;
    } catch (error) {
        // Gracefully handle errors with local fallback
        const fallbackData = getMockEventData();
        statusElement.innerHTML = `
            <div class="text-blue-600">
                <strong>Event Status:</strong> ${fallbackData.status}
                <br>
                <span class="text-sm">${fallbackData.message}</span>
            </div>
        `;
        statusElement.className = 'text-center mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200';
        console.log('Using local event status (static hosting)');
    }
}

function getLocalEventData() {
    const startDate = new Date('2025-07-18T00:00:00');
    const endDate = new Date('2025-07-25T23:59:59');

    let dayOfEvent;
    if (window.AntiCheatSystem && window.AntiCheatSystem.eventConfig) {
        dayOfEvent = window.AntiCheatSystem.eventConfig.getDayOfEvent();
    } else {
        const now = new Date();
        if (now < startDate) dayOfEvent = -1;
        else if (now > endDate) dayOfEvent = 8;
        else {
            const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            dayOfEvent = Math.min(7, diffDays + 1);
        }
    }

    const isActive = dayOfEvent >= 1 && dayOfEvent <= 7;
    const isUpcoming = dayOfEvent < 1;
    const isPast = dayOfEvent > 7;

    let status, message;
    if (isActive) {
        status = 'LIVE';
        message = `Youth Gathering Day ${dayOfEvent} is active!`;
    } else if (isUpcoming) {
        const now = new Date();
        const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        status = 'Upcoming';
        message = `Challenges unlock in ${daysUntil} days (July 18th, 2025)`;
    } else {
        status = 'Concluded';
        message = 'Youth Gathering 2025 has concluded';
    }

    return {
        status,
        message,
        isActive,
        lastUpdated: new Date().toLocaleString()
    };
}

function getMockEventData() {
    return {
        status: 'Demo Mode',
        message: 'Event status simulation active',
        isActive: false,
        lastUpdated: new Date().toLocaleString()
    };
}

document.addEventListener('DOMContentLoaded', loadEventStatus);
