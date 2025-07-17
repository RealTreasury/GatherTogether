const Leaderboard = {
    socket: null,
    retryCount: 0,
    maxRetries: 3,

    init: async () => {
        console.log('🚀 Initializing Leaderboard...');
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = localStorage.getItem('username') || '';
            usernameInput.addEventListener('change', () => {
                localStorage.setItem('username', usernameInput.value);
                Leaderboard.saveCurrentProgress();
            });
        }
        Leaderboard.showLoading();
        Leaderboard.setupSocket();
        await Leaderboard.loadLeaderboard();
    },

    showLoading: () => {
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = `
                <li class="text-center py-4 text-gray-500">
                    <div class="text-4xl mb-2">⏳</div>
                    <div>Loading leaderboard...</div>
                </li>
            `;
        }
    },

    setupSocket: () => {
        if (typeof io === 'function') {
            try {
                Leaderboard.socket = io();
                Leaderboard.socket.on('leaderboardUpdate', data => {
                    console.log('📡 Real-time leaderboard update received');
                    Leaderboard.renderLeaderboard(data);
                });
                Leaderboard.socket.on('connect', () => {
                    console.log('📡 Socket.IO connected');
                });
                Leaderboard.socket.on('disconnect', () => {
                    console.log('📡 Socket.IO disconnected');
                });
            } catch (error) {
                console.warn('Socket.IO setup failed:', error);
            }
        }
    },

    loadLeaderboard: async () => {
        try {
            console.log('📊 Loading leaderboard from Node.js backend...');
            const response = await fetch('/api/bingo/leaderboard');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const leaderboard = await response.json();
            console.log('✅ Leaderboard loaded successfully:', leaderboard);
            Leaderboard.renderLeaderboard(leaderboard);
            Leaderboard.retryCount = 0;
        } catch (error) {
            console.error('❌ Failed to load leaderboard:', error);
            Leaderboard.retryCount++;
            if (Leaderboard.retryCount < Leaderboard.maxRetries) {
                console.log(`🔄 Retrying in 2 seconds... (${Leaderboard.retryCount}/${Leaderboard.maxRetries})`);
                setTimeout(() => Leaderboard.loadLeaderboard(), 2000);
            } else {
                Leaderboard.showError('Unable to load leaderboard. Please ensure the server is running with "npm start".');
            }
        }
    },

    saveScore: async (userId, username, score) => {
        try {
            console.log('💾 Saving score:', { userId, username, score });
            const response = await fetch('/api/bingo/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    username,
                    completedTiles: Array(score).fill(0).map((_, i) => i)
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            console.log('✅ Score saved successfully');
            setTimeout(() => Leaderboard.loadLeaderboard(), 500);
            return true;
        } catch (error) {
            console.error('❌ Failed to save score:', error);
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Failed to save score. Check server connection.', 'error');
            }
            throw error;
        }
    },

    saveCurrentProgress: async () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput ? usernameInput.value || 'Anonymous' : 'Anonymous';
        const userId = Utils.getUserId();
        if (window.BingoTracker && BingoTracker.completedTiles) {
            const completedCount = BingoTracker.completedTiles[BingoTracker.currentMode || 'regular'].size;
            if (completedCount > 0) {
                try {
                    await Leaderboard.saveScore(userId, username, completedCount);
                } catch (error) {
                    console.error('Failed to save current progress:', error);
                }
            }
        }
    },

    renderLeaderboard: (leaderboard) => {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        if (!leaderboard || leaderboard.length === 0) {
            list.innerHTML = `
                <li class="text-center py-4 text-gray-500">
                    <div class="text-4xl mb-2">🏆</div>
                    <div>No scores yet. Complete some bingo challenges!</div>
                    <div class="text-sm mt-2">Scores will appear here as players complete challenges.</div>
                </li>
            `;
            return;
        }
        list.innerHTML = leaderboard.map((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const bgClass = index === 0 ? 'bg-yellow-100 border-yellow-300' :
                           index === 1 ? 'bg-gray-100 border-gray-300' :
                           index === 2 ? 'bg-orange-100 border-orange-300' :
                           'bg-white border-gray-200';
            return `
                <li class="flex justify-between items-center p-3 rounded-lg border ${bgClass} transition-all hover:shadow-md">
                    <div class="flex items-center">
                        <span class="w-8 text-lg">${medal || `${index + 1}.`}</span>
                        <span class="font-medium">${entry.username}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold text-lg">${entry.score}</span>
                        <span class="text-sm text-gray-500 ml-2">pts</span>
                    </div>
                </li>`;
        }).join('');
        list.insertAdjacentHTML('afterend',
            '<div class="text-xs text-green-600 mt-2 text-center">📡 Connected to Node.js backend</div>'
        );
    },

    showError: (message) => {
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = `
                <li class="text-center py-4 text-red-500">
                    <div class="text-4xl mb-2">⚠️</div>
                    <div class="font-bold mb-2">${message}</div>
                    <div class="text-sm mb-4">Make sure to run \"npm start\" in your terminal</div>
                    <button onclick="Leaderboard.refresh()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Try Again
                    </button>
                </li>`;
        }
        if (window.Utils && Utils.showNotification) {
            Utils.showNotification(message, 'error');
        }
    },

    refresh: () => {
        console.log('🔄 Manual leaderboard refresh requested');
        Leaderboard.retryCount = 0;
        Leaderboard.loadLeaderboard();
    },

    cleanup: () => {
        if (Leaderboard.socket) {
            Leaderboard.socket.disconnect();
            Leaderboard.socket = null;
        }
        console.log('Leaderboard cleanup completed');
    }
};

// Initialize when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && App.currentTab === 'leaderboard') {
        Leaderboard.refresh();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Leaderboard.cleanup();
});
