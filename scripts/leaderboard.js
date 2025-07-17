const Leaderboard = {
    firebaseLeaderboard: null,
    isInitialized: false,
    _resolveInitialization: null,
    initializationPromise: null,
    pendingScores: {},

    init: () => {
        if (Leaderboard.isInitialized) return;
        Leaderboard.isInitialized = true;

        // Promise that resolves when Firebase is initialized
        Leaderboard.initializationPromise = new Promise(resolve => {
            Leaderboard._resolveInitialization = resolve;
        });

        console.log('🚀 Scheduling Leaderboard Initialization...');

        // Initialize Firebase when available
        if (window.firebaseApp && window.FirebaseLeaderboard) {
            Leaderboard.initFirebase();
        } else {
            window.addEventListener('firebaseReady', () => Leaderboard.initFirebase());
        }

        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = localStorage.getItem('username') || '';
            usernameInput.addEventListener('input', Leaderboard.validateUsernameInput);
            usernameInput.addEventListener('change', () => {
                const validation = Leaderboard.validateAndCleanUsername(usernameInput.value);
                const cleanUsername = validation.cleanUsername;
                usernameInput.value = cleanUsername;
                localStorage.setItem('username', cleanUsername);
                Leaderboard.saveCurrentProgress();
            });
        }

        const submitScoreBtn = document.getElementById('submit-score-btn');
        if (submitScoreBtn) {
            submitScoreBtn.addEventListener('click', () => {
                Leaderboard.saveCurrentProgress();
                Utils.showNotification('Score submitted successfully!');
            });
        }

    },

    initFirebase: async () => {
        try {
            const firebaseLeaderboard = new window.FirebaseLeaderboard();
            const success = await firebaseLeaderboard.init(window.firebaseApp);

            if (success) {
                Leaderboard.firebaseLeaderboard = firebaseLeaderboard;


                // Subscribe to real-time updates
                Leaderboard.firebaseLeaderboard.subscribeToLeaderboard((scores) => {
                    console.log('📡 Real-time leaderboard update received:', scores);
                    if (App.currentTab === 'leaderboard') {
                        Leaderboard.renderLeaderboard(scores);
                    }
                }, 25);

                // Resolve the initialization promise
                Leaderboard._resolveInitialization();
                // Flush any scores that were queued before Firebase was ready
                Leaderboard.flushPendingScores();
                console.log('✅ Leaderboard is ready for use.');

            } else {
                throw new Error('FirebaseLeaderboard.init() returned false.');
            }
        } catch (error) {
            console.error('Failed to initialize Firebase leaderboard:', error);
            if (App.currentTab === 'leaderboard') {
                Leaderboard.showError('Failed to connect to Firebase. Check console for details.');
            }
            // Resolve the initialization promise even on failure
            Leaderboard._resolveInitialization();
        }
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
        // Socket.IO disabled for static hosting
        console.log('Using Firebase real-time updates instead of Socket.IO');
    },

    loadLeaderboard: async () => {
        // Wait for initialization before loading data
        await Leaderboard.initializationPromise;

        if (Leaderboard.firebaseLeaderboard && Leaderboard.firebaseLeaderboard.isAvailable()) {
            Leaderboard.showLoading();
            try {
                const scores = await Leaderboard.firebaseLeaderboard.getTopScores(25);
                Leaderboard.renderLeaderboard(scores);
                return true;
            } catch (error) {
                console.error('❌ Failed to load leaderboard from Firebase:', error);
                Leaderboard.showError('Failed to load leaderboard. Is Firestore enabled?');
                return false;
            }
        } else {
            console.warn('📊 Firebase not available for loading leaderboard.');
            Leaderboard.showPlaceholderLeaderboard();
            return false;
        }
    },

    saveScore: async (userId, username, score) => {
        // Wait for Firebase initialization
        await Leaderboard.initializationPromise;

        if (!userId || !username || score === undefined) {
            console.error('Invalid parameters for saveScore:', { userId, username, score });
            return false;
        }

        if (Leaderboard.firebaseLeaderboard && Leaderboard.firebaseLeaderboard.isAvailable()) {
            try {
                console.log('💾 Saving score to Firebase:', { userId, username, score });
                await Leaderboard.firebaseLeaderboard.submitScore(userId, username, score);
                console.log('✅ Score saved successfully to Firebase');
                return true;
            } catch (error) {
                console.error('❌ Failed to save score to Firebase:', error);
                if (window.Utils && Utils.showNotification) {
                    Utils.showNotification('Failed to save score. Check console for details.', 'error');
                }
                throw error;
            }
        } else {
            console.warn('Firebase not available, queuing score.');
            Leaderboard.pendingScores[userId] = { userId, username, score };
            return false;
        }
    },

    saveCurrentProgress: async () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput ? usernameInput.value.trim() : '';
        const validation = Leaderboard.validateAndCleanUsername(username);
        const cleanUsername = validation.cleanUsername;
        const finalName = cleanUsername || 'Anonymous';
        const userId = Utils.getUserId();
        
        if (window.BingoTracker && BingoTracker.completedTiles) {
            const completedCount = BingoTracker.completedTiles[BingoTracker.currentMode || 'regular'].size;
            if (completedCount > 0) {
                try {
                    await Leaderboard.saveScore(userId, finalName, completedCount);
                } catch (error) {
                    console.error('Failed to save current progress:', error);
                }
            }
        }
    },

    flushPendingScores: async () => {
        if (!Leaderboard.firebaseLeaderboard || !Leaderboard.firebaseLeaderboard.isAvailable()) {
            console.warn('Firebase still not ready, cannot flush scores');
            return;
        }

        const entries = Object.values(Leaderboard.pendingScores);
        if (entries.length === 0) return;

        console.log('Flushing pending leaderboard scores:', entries.length);
        for (const entry of entries) {
            try {
                await Leaderboard.firebaseLeaderboard.submitScore(entry.userId, entry.username, entry.score);
                delete Leaderboard.pendingScores[entry.userId];
            } catch (err) {
                console.error('Failed to flush score for', entry.userId, err);
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

        // Sort by score descending (in case not sorted)
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 25);

        list.innerHTML = sortedLeaderboard.map((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const bgClass = index === 0 ? 'bg-yellow-100 border-yellow-300' :
                           index === 1 ? 'bg-gray-100 border-gray-300' :
                           index === 2 ? 'bg-orange-100 border-orange-300' :
                           'bg-white border-gray-200';
            
            // Handle different property names
            const username = entry.playerName || entry.username || 'Anonymous';
            const score = entry.score || 0;
            
            return `
                <li class="flex justify-between items-center p-2 rounded-lg border ${bgClass} transition-all hover:shadow-md text-sm">
                    <div class="flex items-center">
                        <span class="w-6">${medal || `${index + 1}.`}</span>
                        <span class="font-medium ml-1">${username}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold">${score}</span>
                        <span class="text-xs text-gray-500 ml-1">pts</span>
                    </div>
                </li>
            `;
        }).join('');
    },

    showPlaceholderLeaderboard: () => {
        const placeholders = [
            { username: 'Complete bingo challenges', score: '???' },
            { username: 'to see real scores!', score: '???' }
        ];
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = `
                <li class="text-center py-4 text-gray-500">
                    <div class="text-4xl mb-2">🔥</div>
                    <div>Waiting for Firebase connection...</div>
                    <div class="text-sm mt-2">Complete bingo challenges and they'll save when connected!</div>
                </li>
            `;
        }
    },

    showError: (message) => {
        const list = document.getElementById('leaderboard-list');
        if (list) {
            list.innerHTML = `
                <li class="text-center py-4 text-red-500">
                    <div class="text-4xl mb-2">⚠️</div>
                    <div class="font-bold mb-2">${message}</div>
                    <div class="text-sm mb-4">
                        Make sure Firestore is enabled in your Firebase project
                    </div>
                    <button onclick="Leaderboard.refresh()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Try Again
                    </button>
                </li>
            `;
        }
    },

    refresh: () => {
        console.log('🔄 Manual leaderboard refresh requested');
        // loadLeaderboard will now safely wait for the connection before fetching
        Leaderboard.loadLeaderboard();
    }
};

// Expose globally for other modules
window.Leaderboard = Leaderboard;

// Auto-refresh when tab becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && App && App.currentTab === 'leaderboard') {
        Leaderboard.refresh();
    }
});
