const ServerStatus = {
    check: async () => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch('/api/polls', { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error('Status ' + res.status);
        } catch (err) {
            console.warn('Node server check failed', err);
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Backend server not running. Start with "npm start".', 'error');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ServerStatus.check();
});
