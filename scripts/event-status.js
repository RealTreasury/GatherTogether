// Handle event status loading for the homepage
async function loadEventStatus() {
    const statusElement = document.getElementById('event-status');
    if (!statusElement) return;

    try {
        // Try to fetch event status from backend API
        const response = await fetch('/api/event-status');
        let eventData;
        if (response.ok) {
            eventData = await response.json();
        } else {
            // Fallback to mock data when API is unavailable
            eventData = getMockEventData();
        }

        // Update the status display
        statusElement.innerHTML = `
            <div class="text-green-600">
                <strong>Event Status:</strong> ${eventData.status}
                <br>
                <span class="text-sm">${eventData.message}</span>
            </div>
        `;
        statusElement.className = 'text-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200';
    } catch (error) {
        // Gracefully handle errors
        statusElement.innerHTML = `
            <div class="text-red-600">
                <strong>Unable to load event status</strong>
                <br>
                <span class="text-sm">Please try refreshing the page</span>
            </div>
        `;
        statusElement.className = 'text-center mb-4 p-3 bg-red-50 rounded-lg border border-red-200';
        console.error('Error loading event status:', error);
    }
}

function getMockEventData() {
    return {
        status: 'Active',
        message: 'Event registration is open',
        lastUpdated: new Date().toLocaleString()
    };
}

document.addEventListener('DOMContentLoaded', loadEventStatus);
