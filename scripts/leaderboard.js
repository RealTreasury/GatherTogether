const Leaderboard = {
    firebaseLeaderboard: null,

    init: async () => {
        console.log('🚀 Initializing Leaderboard...');

        // Wait for Firebase to be ready
        if (window.firebaseApp && window.FirebaseLeaderboard) {
            await Leaderboard.initFirebase();
        } else {
            window.addEventListener('firebaseReady', async () => {
                await Leaderboard.initFirebase();
            });
        }

        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = localStorage.getItem('username') || '';
            usernameInput.addEventListener('change', () => {
                localStorage.setItem('username', usernameInput.value);
                Leaderboard.saveCurrentProgress();
            });
        }

        Leaderboard.showLoading();
    },

    initFirebase: async () => {
        try {
            const firebaseLeaderboard = new window.FirebaseLeaderboard();
            await firebaseLeaderboard.init(window.firebaseApp);
            Leaderboard.firebaseLeaderboard = firebaseLeaderboard;
            
            // Update status
            const firebaseStatus = document.getElementById('firebase-status');
            if (firebaseStatus) {
                firebaseStatus.innerHTML = '🔥 Firebase: <span class="text-green-600">Connected</span>';
            }
            
            await Leaderboard.loadLeaderboard();

            // Subscribe to real-time updates
            Leaderboard.firebaseLeaderboard.subscribeToLeaderboard((scores) => {
                console.log('📡 Real-time leaderboard update received:', scores);
                Leaderboard.renderLeaderboard(scores);
            });
        } catch (error) {
            console.error('Failed to initialize Firebase leaderboard:', error);
            const firebaseStatus = document.getElementById('firebase-status');
            if (firebaseStatus) {
                firebaseStatus.innerHTML = '🔥 Firebase: <span class="text-red-600">Error</span>';
            }
            Leaderboard.showError('Failed to connect to Firebase. Check console for details.');
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

    loadLeaderboard: async () => {
        if (Leaderboard.firebaseLeaderboard && Leaderboard.firebaseLeaderboard.isAvailable()) {
            try {
                const scores = await Leaderboard.firebaseLeaderboard.getTopScores(50);
                Leaderboard.renderLeaderboard(scores);
                return true;
            } catch (error) {
                console.error('❌ Failed to load leaderboard from Firebase:', error);
                Leaderboard.showError('Failed to load leaderboard. Is Firestore enabled?');
                return false;
            }
        } else {
            console.log('📊 Firebase not available yet.');
            Leaderboard.showPlaceholderLeaderboard();
            return false;
        }
    },

    saveScore: async (userId, username, score) => {
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
                    Utils.showNotification('Failed to save score. Check if Firestore is enabled.', 'error');
                }
                throw error;
            }
        } else {
            console.warn('Firebase not available, cannot save score.');
            return false;
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

        // Sort by score descending (in case not sorted)
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);

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
        Leaderboard.showLoading();
        Leaderboard.loadLeaderboard();
    }
};

// Auto-refresh when tab becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && App && App.currentTab === 'leaderboard') {
        Leaderboard.refresh();
    }
});
