// Utility functions used across the application

const Utils = {
    // Generate random ID
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    },

    // Format date for display
    formatDate: (date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    // Get day of year
    getDayOfYear: (date = new Date()) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    // Convert milliseconds to a readable duration
    formatDuration: (ms) => {
        const minutes = Math.ceil(ms / (1000 * 60));
        if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? '' : 's'}`;
        }
        const hours = Math.ceil(ms / (1000 * 60 * 60));
        if (hours < 24) {
            return `${hours} hour${hours === 1 ? '' : 's'}`;
        }
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        return `${days} day${days === 1 ? '' : 's'}`;
    },

    // Short label for countdown timer
    formatDurationShort: (ms) => {
        const minutes = Math.ceil(ms / (1000 * 60));
        // Use hours once the countdown exceeds 90 minutes
        if (minutes < 90) return `${minutes}m`;
        const hours = Math.ceil(ms / (1000 * 60 * 60));
        if (hours < 24) return `${hours}h`;
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        return `${days}d`;
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },


    // Show notification
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Generate or retrieve unique user ID
    getUserId: () => {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = Utils.generateId();
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
};
