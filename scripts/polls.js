export function initPolls() {
    const container = document.getElementById('polls-container');
    if (container) {
        container.textContent = 'Polls and Q&A coming soon...';
    }
}

// Expose initializer globally
window.initPolls = initPolls;
