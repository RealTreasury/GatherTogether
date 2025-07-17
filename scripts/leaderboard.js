const Leaderboard = {
    socket: null,
    firebaseLeaderboard: null,
    unsubscribeFirebase: null,
    useFirebase: false,
    retryCount: 0,
    maxRetries: 3,

    init: async () => {
        console.log('Initializing Leaderboard...');
        
        // Set up username input
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = localStorage.getItem('username') || '';
            usernameInput.addEventListener('change', () => {
                localStorage.setItem('username', usernameInput.value);
                Leaderboard.saveCurrentProgress();
            });
        }

        // Try to initialize Firebase first
        await Leaderboard.initializeFirebase();
        
        // Always set up Node.js backend as fallback
        Leaderboard.setupNodeJSFallback();
        
        // Load initial leaderboard data
        await Leaderboard.loadLeaderboard();
    },

    initializeFirebase: async () => {
        try {
            if (window.firebaseApp && window.FirebaseLeaderboard) {
                Leaderboard.firebaseLeaderboard = new window.FirebaseLeaderboard();
                const initialized = await Leaderboard.firebaseLeaderboard.init(window.firebaseApp);
                
                if (initialized) {
                    Leaderboard.useFirebase = true;
                    console.log('✅ Firebase leaderboard initialized - using Firebase as primary');
                    Leaderboard.setupFirebaseRealtime();
                    return true;
                }
            }
        } catch (error) {
            console.warn('Firebase initialization failed:', error);
        }
        
        console.log('📡 Firebase not available - using Node.js backend only');
        Leaderboard.useFirebase = false;
        return false;
    },

    setupFirebaseRealtime: () => {
        if (!Leaderboard.firebaseLeaderboard || !Leaderboard.firebaseLeaderboard.isAvailable()) return;

        try {
            Leaderboard.unsubscribeFirebase = Leaderboard.firebaseLeaderboard.subscribeToLeaderboard(
                (scores) => {
                    console.log('🔥 Real-time Firebase update received');
                    Leaderboard.renderLeaderboard(scores);
                },
                10
            );
        } catch (error) {
            console.error('Failed to set up Firebase real-time listener:', error);
            // Fall back to periodic polling
            Leaderboard.startPeriodicUpdate();
        }
    },

    setupNodeJSFallback: () => {
        // Set up Socket.IO for Node.js backend real-time updates
        if (typeof io === 'function' && !Leaderboard.socket) {
            try {
                Leaderboard.socket = io();
                Leaderboard.socket.on('leaderboardUpdate', data => {
                    // Only use Node.js updates if Firebase is not available
                    if (!Leaderboard.useFirebase) {
                        console.log('🔧 Node.js backend update received');
                        Leaderboard.renderLeaderboard(data);
                    }
                });
                
                Leaderboard.socket.on('connect', () => {
                    console.log('📡 Connected to Node.js backend');
                });
                
                Leaderboard.socket.on('disconnect', () => {
                    console.log('📡 Disconnected from Node.js backend');
                });
            } catch (error) {
                console.warn('Socket.IO setup failed:', error);
            }
        }
    },

    loadLeaderboard: async () => {
        let success = false;

        // Try Firebase first
        if (Leaderboard.useFirebase && Leaderboard.firebaseLeaderboard) {
            try {
                const scores = await Leaderboard.firebaseLeaderboard.getTopScores(10);
                Leaderboard.renderLeaderboard(scores);
                console.log('✅ Leaderboard loaded from Firebase');
                Leaderboard.retryCount = 0; // Reset retry count on success
                return;
            } catch (error) {
                console.error('Failed to load from Firebase:', error);
                Leaderboard.retryCount++;
                
                // If Firebase fails too many times, switch to Node.js
                if (Leaderboard.retryCount >= Leaderboard.maxRetries) {
                    console.log('🔄 Switching to Node.js backend after Firebase failures');
                    Leaderboard.useFirebase = false;
                }
            }
        }

        // Fallback to Node.js backend
        try {
            const res = await fetch('/api/bingo/leaderboard');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const leaderboard = await res.json();
            Leaderboard.renderLeaderboard(leaderboard);
            console.log('✅ Leaderboard loaded from Node.js backend');
            success = true;
        } catch (err) {
            console.error('Failed to load from Node.js backend:', err);
            Leaderboard.showError('Unable to load leaderboard. Please check your connection.');
        }

        // If Node.js also failed, try Firebase again after a delay
        if (!success && !Leaderboard.useFirebase) {
            setTimeout(() => Leaderboard.retryFirebase(), 5000);
        }
    },

    retryFirebase: async () => {
        console.log('🔄 Retrying Firebase connection...');
        const initialized = await Leaderboard.initializeFirebase();
        if (initialized) {
            await Leaderboard.loadLeaderboard();
        }
    },

    saveScore: async (userId, username, score) => {
        let firebaseSuccess = false;
        let nodeSuccess = false;

        // Try Firebase first
        if (Leaderboard.useFirebase && Leaderboard.firebaseLeaderboard) {
            try {
                await Leaderboard.firebaseLeaderboard.submitScore(userId, username, score);
                firebaseSuccess = true;
                console.log('✅ Score saved to Firebase');
            } catch (error) {
                console.error('Failed to save to Firebase:', error);
                Leaderboard.retryCount++;
                
                if (Leaderboard.retryCount >= Leaderboard.maxRetries) {
                    Leaderboard.useFirebase = false;
                }
            }
        }

        // Always try Node.js backend as well (for redundancy)
        try {
            const response = await fetch('/api/bingo/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username, completedTiles: Array(score).fill(0).map((_, i) => i) })
            });
            
            if (response.ok) {
                nodeSuccess = true;
                console.log('✅ Score saved to Node.js backend');
            }
        } catch (error) {
            console.error('Failed to save to Node.js backend:', error);
        }

        if (!firebaseSuccess && !nodeSuccess) {
            throw new Error('Failed to save score to any backend');
        }

        // If only Node.js succeeded and we're not using Firebase real-time, refresh manually
        if (!firebaseSuccess && nodeSuccess && !Leaderboard.useFirebase) {
            setTimeout(() => Leaderboard.loadLeaderboard(), 1000);
        }

        return firebaseSuccess || nodeSuccess;
    },

    saveCurrentProgress: async () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput ? usernameInput.value || 'Anonymous' : 'Anonymous';
        const userId = Utils.getUserId();
        
        if (window.BingoTracker && BingoTracker.completedTiles) {
            const completedCount = BingoTracker.completedTiles[BingoTracker.currentMode || 'regular'].size;
            
            try {
                await Leaderboard.saveScore(userId, username, completedCount);
            } catch (error) {
                console.error('Failed to save current progress:', error);
                Utils.showNotification('Unable to save progress to leaderboard', 'error');
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
                    <div>No scores yet. Be the first!</div>
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
                </li>
            `;
        }).join('');

        // Add status indicator
        const statusIndicator = Leaderboard.useFirebase ? 
            '<div class="text-xs text-green-600 mt-2">🔥 Real-time updates via Firebase</div>' :
            '<div class="text-xs text-blue-600 mt-2">📡 Updates via Node.js backend</div>';
        
        list.insertAdjacentHTML('afterend', statusIndicator);
    },

    showError: (message) => {
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = `
                <li class="text-center py-4 text-red-500">
                    <div class="text-4xl mb-2">⚠️</div>
                    <div>${message}</div>
                    <button onclick="Leaderboard.loadLeaderboard()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Try Again
                    </button>
                </li>
            `;
        }
        
        if (window.Utils && Utils.showNotification) {
            Utils.showNotification(message, 'error');
        }
    },

    startPeriodicUpdate: () => {
        // Fallback periodic updates if real-time fails
        setInterval(() => {
            if (!Leaderboard.useFirebase || !Leaderboard.unsubscribeFirebase) {
                Leaderboard.loadLeaderboard();
            }
        }, 30000); // Update every 30 seconds
    },

    cleanup: () => {
        // Clean up Firebase listeners
        if (Leaderboard.unsubscribeFirebase) {
            Leaderboard.unsubscribeFirebase();
            Leaderboard.unsubscribeFirebase = null;
        }

        if (Leaderboard.firebaseLeaderboard) {
            Leaderboard.firebaseLeaderboard.unsubscribeAll();
        }

        // Clean up Socket.IO
        if (Leaderboard.socket) {
            Leaderboard.socket.disconnect();
            Leaderboard.socket = null;
        }

        console.log('Leaderboard cleanup completed');
    },

    // Public method for manual refresh
    refresh: () => {
        console.log('Manual leaderboard refresh requested');
        Leaderboard.loadLeaderboard();
    },

    // Get current backend status
    getStatus: () => {
        return {
            firebase: Leaderboard.useFirebase,
            nodeJS: !!Leaderboard.socket,
            retryCount: Leaderboard.retryCount
        };
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
