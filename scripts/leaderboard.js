const Leaderboard = {
    firebaseLeaderboard: null,
    isInitialized: false,
    _resolveInitialization: null,
    initializationPromise: null,
    pendingScores: {},
    getMaxPossibleScore: () => {
        try {
            const regular = typeof BINGO_CHALLENGES !== 'undefined' ? BINGO_CHALLENGES.length : 25;
            const completionist = typeof COMPLETIONIST_CHALLENGES !== 'undefined'
                ? COMPLETIONIST_CHALLENGES.reduce((sum, ch) => {
                      const extras = ch.sublist ? ch.sublist.length : (ch.requiredCount || 0);
                      return sum + extras + 1; // sub-items plus tile itself
                  }, 0)
                : 16;
            return regular + completionist;
        } catch (err) {
            console.warn('Failed to calculate max possible score', err);
            return 41; // fallback to previous value
        }
    },

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
        const usernameContainer = document.getElementById('username-container');
        const usernameDisplay = document.getElementById('username-display');
        const currentUsername = document.getElementById('current-username');
        const changeUsernameBtn = document.getElementById('change-username-btn');

        const showDisplay = (name) => {
            if (currentUsername) currentUsername.textContent = name;
            if (usernameDisplay) usernameDisplay.classList.remove('hidden');
            if (usernameContainer) usernameContainer.classList.add('hidden');
        };

        const showInput = () => {
            if (usernameDisplay) usernameDisplay.classList.add('hidden');
            if (usernameContainer) usernameContainer.classList.remove('hidden');
        };

        if (changeUsernameBtn) {
            changeUsernameBtn.addEventListener('click', () => {
                showInput();
                if (usernameInput) usernameInput.focus();
            });
        }

        if (usernameInput) {
            usernameInput.value = localStorage.getItem('username') || '';
            if (usernameInput.value) {
                showDisplay(usernameInput.value);
            }

            usernameInput.addEventListener('change', () => {
                let name = usernameInput.value.trim();
                if (window.UsernameValidator &&
                    typeof window.UsernameValidator.getCleanUsername === 'function') {
                    const clean = window.UsernameValidator.getCleanUsername(name);
                    if (clean !== name && window.Utils?.showNotification) {
                        Utils.showNotification(`Username changed to "${clean}" due to policy.`, 'warning');
                    }
                    name = clean;
                }

                usernameInput.value = name;
                localStorage.setItem('username', name);
                showDisplay(name);
                Leaderboard.saveCurrentProgress();
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

    // Enhanced renderLeaderboard with anti-cheat protection
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

        // Filter out flagged users from leaderboard display
        const filteredLeaderboard = Leaderboard.filterSuspiciousUsers(leaderboard);

        // Sort by score descending (in case not sorted)
        const sortedLeaderboard = [...filteredLeaderboard]
            .sort((a, b) => b.score - a.score)
            .slice(0, 25);

        if (sortedLeaderboard.length === 0) {
            list.innerHTML = `
                <li class="text-center py-4 text-gray-500">
                    <div class="text-4xl mb-2">🛡️</div>
                    <div>All current scores are under review for fair play.</div>
                    <div class="text-sm mt-2">Complete challenges authentically to appear here!</div>
                </li>
            `;
            return;
        }

        list.innerHTML = sortedLeaderboard.map((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const bgClass = index === 0 ? 'bg-yellow-100 border-yellow-300' :
                           index === 1 ? 'bg-gray-100 border-gray-300' :
                           index === 2 ? 'bg-orange-100 border-orange-300' :
                           'bg-white border-gray-200';

            // Handle different property names
            const username = entry.playerName || entry.username || 'Anonymous';
            const score = entry.score || 0;

            // Add verification badge for clean players
            const verificationBadge = Leaderboard.isVerifiedPlayer(entry) ?
                '<span class="text-green-500 text-xs ml-1" title="Verified fair play">✓</span>' : '';

            return `
                <li class="flex justify-between items-center p-2 rounded-lg border ${bgClass} transition-all hover:shadow-md text-sm">
                    <div class="flex items-center">
                        <span class="w-6">${medal || `${index + 1}.`}</span>
                        <span class="font-medium ml-1">${username}${verificationBadge}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold">${score}</span>
                        <span class="text-xs text-gray-500 ml-1">pts</span>
                    </div>
                </li>
            `;
        }).join('');

        // Show filtered count if any users were removed
        const filteredCount = leaderboard.length - filteredLeaderboard.length;
        if (filteredCount > 0) {
            const filterNotice = document.createElement('div');
            filterNotice.className = 'text-center text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded';
            filterNotice.innerHTML = `
                🛡️ ${filteredCount} entries hidden due to suspicious activity. 
                <br>Play fairly to ensure your score appears!
            `;
            list.parentNode.appendChild(filterNotice);
        }
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

// PHASE 5: Enhanced leaderboard protection

// NEW: Filter suspicious users from leaderboard
Leaderboard.filterSuspiciousUsers = (leaderboard) => {
    if (!window.AntiCheatSystem) return leaderboard;

    return leaderboard.filter(entry => {
        // Handle undefined or missing userId/id safely
        const userId = entry.id || entry.userId || entry.playerId;
        const score = entry.score || 0;

        // Skip entries without valid userIds
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.warn('Leaderboard entry without valid userId:', entry);
            return false;
        }

        const cleanUserId = userId.trim();

        // Check if user is flagged by anti-cheat system
        if (window.AntiCheatSystem.isFlagged(cleanUserId)) {
            console.log(`Filtering flagged user from leaderboard: ${cleanUserId}`);
            return false;
        }

        // Check for impossible scores (more than total challenges available)
        const maxPossibleScore = Leaderboard.getMaxPossibleScore();
        if (score > maxPossibleScore) {
            console.log(`Filtering user with impossible score: ${cleanUserId} (${score} > ${maxPossibleScore})`);
            window.AntiCheatSystem.flagUser(cleanUserId, 'Impossible score detected');
            return false;
        }

        // Check for suspicious rapid progression
        if (Leaderboard.hasSuspiciousProgression(entry)) {
            console.log(`Filtering user with suspicious progression: ${cleanUserId}`);
            window.AntiCheatSystem.flagUser(cleanUserId, 'Suspicious rapid progression');
            return false;
        }

        return true;
    });
};

// NEW: Check for suspicious progression patterns
Leaderboard.hasSuspiciousProgression = (entry) => {
    const score = entry.score || 0;
    const createdAt = entry.createdAt || entry.updatedAt;

    if (!createdAt || score < 5) return false; // Skip check for low scores

    try {
        const accountAge = Date.now() - new Date(createdAt).getTime();
        const hoursOld = accountAge / (1000 * 60 * 60);

        // Flag if user completed more than 10 challenges in first hour
        if (hoursOld < 1 && score > 10) {
            return true;
        }

        // Flag if user has extremely high score relative to account age
        const maxReasonableRate = 8; // Max 8 challenges per hour seems reasonable
        if (score > (hoursOld * maxReasonableRate)) {
            return true;
        }

        return false;
    } catch (error) {
        console.warn('Error checking progression for user:', entry, error);
        return false;
    }
};

// NEW: Check if player is verified (has consistent, reasonable progression)
Leaderboard.isVerifiedPlayer = (entry) => {
    const score = entry.score || 0;
    const userId = entry.id || entry.userId || entry.playerId;

    // Skip verification for entries without valid userIds
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        return false;
    }

    const cleanUserId = userId.trim();

    // Consider players verified if they have moderate scores and aren't flagged
    if (score >= 5 && score <= 30 && !window.AntiCheatSystem?.isFlagged(cleanUserId)) {
        return true;
    }

    return false;
};

// Enhanced saveScore with additional validation
const originalSaveScore = Leaderboard.saveScore;
Leaderboard.saveScore = async (userId, username, score) => {
    // Validate userId before proceeding
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.warn('Invalid userId provided to saveScore:', userId);
        return false;
    }

    const cleanUserId = userId.trim();

    // Pre-submission validation
    if (window.AntiCheatSystem?.isFlagged(cleanUserId)) {
        console.warn('Blocked score submission from flagged user:', cleanUserId);
        if (window.Utils?.showNotification) {
            Utils.showNotification('Score submission blocked due to suspicious activity.', 'error');
        }
        return false;
    }

    // Check for reasonable score progression
    const maxReasonableScore = Leaderboard.getMaxPossibleScore();
    if (score > maxReasonableScore) {
        console.warn('Blocked impossible score submission:', { userId: cleanUserId, score, max: maxReasonableScore });
        window.AntiCheatSystem?.flagUser(cleanUserId, 'Attempted impossible score submission');
        if (window.Utils?.showNotification) {
            Utils.showNotification('Invalid score detected. Please refresh and try again.', 'error');
        }
        return false;
    }

    // Proceed with original save if validation passes
    return originalSaveScore.call(Leaderboard, cleanUserId, username, score);
};

// NEW: Enhanced refresh with anti-cheat status indicator
const originalRefresh = Leaderboard.refresh;
Leaderboard.refresh = () => {
    // Update anti-cheat status indicator
    Leaderboard.updateAntiCheatStatus();

    // Call original refresh
    originalRefresh.call(Leaderboard);
};

// NEW: Update anti-cheat status indicator
Leaderboard.updateAntiCheatStatus = () => {
    const statusElement = document.getElementById('anticheat-status');
    const statusText = document.getElementById('anticheat-text');

    if (!statusElement || !statusText) return;

    const flaggedCount = window.AntiCheatSystem?.flaggedUsers?.size || 0;
    const eventStatus = window.AntiCheatSystem?.getEventStatus() || {};

    // Show status indicator
    statusElement.style.display = 'block';

    if (flaggedCount > 0) {
        statusElement.className = 'anticheat-status warning';
        statusText.textContent = `Protection active (${flaggedCount} flagged)`;
    } else if (eventStatus.isActive) {
        statusElement.className = 'anticheat-status';
        statusText.textContent = 'Fair play protection active';
    } else {
        statusElement.className = 'anticheat-status';
        statusText.textContent = 'System ready';
    }
};

// NEW: Admin function to manually review flagged users (for testing)
Leaderboard.reviewFlaggedUsers = () => {
    if (!window.AntiCheatSystem) {
        console.log('Anti-cheat system not available');
        return;
    }

    const flaggedUsers = Array.from(window.AntiCheatSystem.flaggedUsers);
    console.log('Flagged users:', flaggedUsers);

    const recentEvents = window.AntiCheatSystem.events
        .filter(e => e.type === 'flag')
        .slice(-10);

    console.log('Recent flag events:', recentEvents);

    return {
        flaggedUsers,
        recentEvents,
        totalEvents: window.AntiCheatSystem.events.length
    };
};

// Initialize anti-cheat status on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        Leaderboard.updateAntiCheatStatus();
    }, 1000);
});

console.log('✅ Enhanced leaderboard protection loaded');

// Expose globally for other modules
window.Leaderboard = Leaderboard;

// Auto-refresh when tab becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && App && App.currentTab === 'leaderboard') {
        Leaderboard.refresh();
    }
});
