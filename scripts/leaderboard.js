const Leaderboard = {
    socket: null,
    retryCount: 0,
    maxRetries: 3,
    isFirebaseEnabled: false,
    firebaseLeaderboard: null,

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
        Leaderboard.initFirebase();
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
                    console.log('📡 Real-time leaderboard update received:', data);
                    Leaderboard.renderLeaderboard(data);
                });
                
                Leaderboard.socket.on('connect', () => {
                    console.log('📡 Socket.IO connected');
                    // Update status indicator
                    const nodeStatus = document.getElementById('nodejs-status');
                    if (nodeStatus) {
                        nodeStatus.innerHTML = '📡 Node.js: <span class="text-green-600">Connected (Real-time)</span>';
                    }
                });

                Leaderboard.socket.on('disconnect', () => {
                    console.log('📡 Socket.IO disconnected');
                    const nodeStatus = document.getElementById('nodejs-status');
                    if (nodeStatus) {
                        nodeStatus.innerHTML = '📡 Node.js: <span class="text-yellow-600">Disconnected</span>';
                    }
                });
            } catch (error) {
                console.warn('Socket.IO setup failed:', error);
            }
        }
    },

    initFirebase: () => {
        const connect = async () => {
            if (typeof FirebaseLeaderboard !== 'function' || !window.firebaseApp) {
                return;
            }
            Leaderboard.firebaseLeaderboard = new FirebaseLeaderboard();
            const ok = await Leaderboard.firebaseLeaderboard.init(window.firebaseApp);
            Leaderboard.isFirebaseEnabled = ok;
            if (ok) {
                Leaderboard.firebaseLeaderboard.subscribeToLeaderboard(data => {
                    Leaderboard.renderLeaderboard(data);
                }, 50);
            }
        };

        if (window.firebaseApp) {
            connect();
        } else {
            window.addEventListener('firebaseReady', connect, { once: true });
        }
    },

    loadLeaderboard: async () => {
        if (Leaderboard.firebaseLeaderboard && Leaderboard.firebaseLeaderboard.isAvailable()) {
            try {
                const data = await Leaderboard.firebaseLeaderboard.getTopScores(50);
                Leaderboard.renderLeaderboard(data);
                return true;
            } catch (error) {
                console.error('Failed to load leaderboard from Firebase:', error);
                Leaderboard.showError('Failed to load leaderboard');
                return false;
            }
        }

        console.warn('Firebase leaderboard not initialized');
        Leaderboard.showError('Leaderboard unavailable');
        return false;
    },

    saveScore: async (userId, username, score) => {
        if (!userId || !username || score === undefined) {
            console.error('Invalid parameters for saveScore:', { userId, username, score });
            return false;
        }

        try {
            console.log('💾 Saving score:', { userId, username, score });

            if (Leaderboard.firebaseLeaderboard && Leaderboard.firebaseLeaderboard.isAvailable()) {
                try {
                    await Leaderboard.firebaseLeaderboard.submitScore(userId, username, score);
                    console.log('✅ Score submitted to Firebase');
                } catch (fbError) {
                    console.error('Firebase score submit failed:', fbError);
                }
            }

            // Try the leaderboard endpoint first (matches server expectations)
            const response = await fetch('/api/bingo/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    playerId: userId, 
                    playerName: username, 
                    score: score
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Score saved successfully:', result);
            
            // Don't reload immediately if using Socket.IO (it will update automatically)
            if (!Leaderboard.socket) {
                setTimeout(() => Leaderboard.loadLeaderboard(), 500);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to save score:', error);
            
            // Try alternative endpoint as fallback
            try {
                console.log('🔄 Trying alternative progress endpoint...');
                const fallbackResponse = await fetch('/api/bingo/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId, 
                        username, 
                        completedTiles: Array.from({length: score}, (_, i) => i)
                    })
                });
                
                if (fallbackResponse.ok) {
                    console.log('✅ Score saved via fallback endpoint');
                    if (!Leaderboard.socket) {
                        setTimeout(() => Leaderboard.loadLeaderboard(), 500);
                    }
                    return true;
                }
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
            }
            
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Failed to save score. Check server connection.', 'error');
            }
            throw error;
        }
    },

    saveCurrentProgress: async () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput ? usernameInput.value.trim() || 'Anonymous' : 'Anonymous';
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
                </li>
            `;
            return;
        }

        // Sort by score descending (in case server doesn't sort)
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);

        list.innerHTML = sortedLeaderboard.map((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const bgClass = index === 0 ? 'bg-yellow-100 border-yellow-300' : 
                           index === 1 ? 'bg-gray-100 border-gray-300' : 
                           index === 2 ? 'bg-orange-100 border-orange-300' : 
                           'bg-white border-gray-200';
            
            // Handle different property names from server
            const username = entry.playerName || entry.username || 'Anonymous';
            const score = entry.score || 0;
            
            return `
                <li class="flex justify-between items-center p-3 rounded-lg border ${bgClass} transition-all hover:shadow-md">
                    <div class="flex items-center">
                        <span class="w-8 text-lg">${medal || `${index + 1}.`}</span>
                        <span class="font-medium">${username}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold text-lg">${score}</span>
                        <span class="text-sm text-gray-500 ml-2">pts</span>
                    </div>
                </li>
            `;
        }).join('');
    },

    showError: (message) => {
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = `
                <li class="text-center py-4 text-red-500">
                    <div class="text-4xl mb-2">⚠️</div>
                    <div class="font-bold mb-2">${message}</div>
                    <div class="text-sm mb-4">Make sure to run: <code class="bg-gray-200 px-2 py-1 rounded">npm start</code></div>
                    <button onclick="Leaderboard.refresh()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Try Again
                    </button>
                </li>
            `;
        }
    },

    refresh: () => {
        console.log('🔄 Manual leaderboard refresh requested');
        Leaderboard.retryCount = 0;
        Leaderboard.showLoading();
        Leaderboard.loadLeaderboard();
    },

    cleanup: () => {
        if (Leaderboard.socket) {
            Leaderboard.socket.disconnect();
            Leaderboard.socket = null;
        }
    }
};

// Auto-refresh when tab becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && App && App.currentTab === 'leaderboard') {
        Leaderboard.refresh();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Leaderboard.cleanup();
});
