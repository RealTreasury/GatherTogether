const Leaderboard = {
    socket: null,
    init: () => {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = localStorage.getItem('username') || '';
            usernameInput.addEventListener('change', () => {
                localStorage.setItem('username', usernameInput.value);
                if (window.BingoTracker && BingoTracker.saveProgress) {
                    BingoTracker.saveProgress().then(() => {
                        Leaderboard.loadLeaderboard();
                    });
                }
            });
        }
        Leaderboard.loadLeaderboard();
        Leaderboard.setupSocket();
    },

    loadLeaderboard: async () => {
        try {
            const res = await fetch('/api/bingo/leaderboard');
            const leaderboard = await res.json();
            Leaderboard.renderLeaderboard(leaderboard);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Unable to load leaderboard. Is the backend running?', 'error');
            }
        }
    },

    renderLeaderboard: (leaderboard) => {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        if (leaderboard.length === 0) {
            list.innerHTML = '<li>No scores yet. Be the first!</li>';
            return;
        }

        list.innerHTML = leaderboard.map((entry, index) => `
            <li class="flex justify-between items-center p-2 rounded-md ${index === 0 ? 'bg-yellow-200' : ''}">
                <span>${index + 1}. ${entry.username}</span>
                <span class="font-bold">${entry.score}</span>
            </li>
        `).join('');
    },

    setupSocket: () => {
        if (typeof io !== 'function' || Leaderboard.socket) return;
        Leaderboard.socket = io();
        Leaderboard.socket.on('leaderboardUpdate', data => {
            Leaderboard.renderLeaderboard(data);
        });
    }
};

// Optionally initialize when tab is shown

