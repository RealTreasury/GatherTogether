// PHASE 1: Enhanced anti-cheat-system.js
// Add this to your existing anti-cheat-system.js file

const AntiCheatSystem = {
    events: [],
    flaggedUsers: new Set(),
    lastActions: {},
    minimumIntervals: new Map(),
    userCompletionTimes: new Map(),
    
    // NEW: Event date configuration
    eventConfig: {
        startDate: new Date('2025-07-18T00:00:00'), // July 18, 2025
        endDate: new Date('2025-07-25T23:59:59'),   // July 25, 2025
        isEventActive: function() {
            const now = new Date();
            return now >= this.startDate && now <= this.endDate;
        },
        getDayOfEvent: function() {
            const now = new Date();
            if (now < this.startDate) return -1; // Before event
            if (now > this.endDate) return 8;    // After event
            
            const diffTime = now - this.startDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return Math.min(7, diffDays + 1); // Days 1-7
        }
    },

    setupChallengeRules() {
        this.minimumIntervals.clear();
        
        // Regular challenges (in minutes) - conservative starting values
        this.minimumIntervals.set('regular', new Map([
            [0, 15],   // Selfie with Martin Luther figure - 15 min
            [1, 30],   // Learn someone's name - 30 min
            [2, 5],    // Attend the Saturday mass event - 5 min
            [3, 20],   // Visit 3 booths - 20 min
            [4, 45],   // Service project - 45 min
            [5, 10],   // Chicken dance - 10 min
            [6, 30],   // Memorize verse - 30 min
            [7, 5],    // Take communion - 5 min
            [8, 15],   // Ask speaker question - 15 min
            [9, 60],   // Exchange contact info - 60 min
            [10, 30],  // Attend breakout session - 30 min
            [11, 20],  // Pray with someone - 20 min
            [12, 15],  // Sample New Orleans cuisine - 15 min
            [13, 10],  // Group photo - 10 min
            [14, 20],  // Visit prayer station - 20 min
            [15, 30],  // Share experience - 30 min
            [16, 5],   // Attend Mass Event Plus - 5 min
            [17, 15],  // Give Rev. Doug Bender a high five or a hug - 15 min
            [18, 25],  // Take a picture of someone wearing a sombrero - 25 min
            [19, 10],  // Take a picture with a comfort dog - 10 min
            [20, 20],  // Large group games - 20 min
            [21, 45],  // Share meal with group - 45 min
            [22, 30],  // Have a conversation entirely in Disney lyrics - 30 min
            [23, 5],   // Social media post - 5 min
            [24, 10]   // High-five 10 people - 10 min
        ]));

        // Completionist challenges (in hours) - much longer intervals
        this.minimumIntervals.set('completionist', new Map([
            [0, 168],  // Meet all 50 states - 7 days (full event)
            [1, 48],   // Meet 5 countries - 2 days
            [2, 72],   // Collect all prizes - 3 days
            [3, 48],   // Every game - 2 days
            [4, 24],   // 15+ sessions - 1 day
            [5, 36],   // Thank 10 volunteers - 1.5 days
            [6, 24],   // 3+ service opportunities - 1 day
            [7, 48],   // All speaker autographs - 2 days
            [8, 168],  // Each mass event - 7 days
            [9, 12],   // Lead prayer circle - 12 hours
            [10, 72],  // 25+ new friends - 3 days
            [11, 168], // Daily acts of kindness - 7 days
            [12, 12],  // Fast for meal - 12 hours
            [13, 48],  // Photos with speakers - 2 days
            [14, 120], // Visit every booth - 5 days
            [15, 168]  // All main sessions - 7 days
        ]));
    },

    // NEW: Check if challenge should be available based on event day
    isChallengeAvailable(mode, index) {
        const dayOfEvent = this.eventConfig.getDayOfEvent();

        // Before event starts - no challenges available
        if (dayOfEvent < 1) return false;

        // After event ends - all challenges available for completion
        if (dayOfEvent > 7) return true;

        if (mode === 'regular') {
            // Saturday mass event only available after 8pm Saturday
            if (index === 2) {
                const massDate = new Date(this.eventConfig.startDate);
                massDate.setDate(massDate.getDate() + 2); // Saturday of event
                massDate.setHours(20, 0, 0, 0); // 8 PM
                return new Date() >= massDate;
            }

            // Communion challenge only on Wednesday during the event
            if (index === 7) {
                const isWednesday = new Date().getDay() === 3; // 0=Sun,3=Wed
                return isWednesday;
            }

            // Regular challenges unlock progressively
            return dayOfEvent >= 1;
        } else if (mode === 'completionist') {
            // Custom unlock schedule for certain challenges
            if (index === 12) {
                // Convention center games start Saturday (Day 3)
                return dayOfEvent >= 3;
            }
            if (index === 9 || index === 14) {
                // Sessions/workshops and exhibitor booths open Sunday (Day 4)
                return dayOfEvent >= 4;
            }
            if (index === 15) {
                // Hair color challenge available from the start
                return dayOfEvent >= 1;
            }
            if (index === 7) {
                // Daily acts of kindness available from the start
                return dayOfEvent >= 1;
            }

            // Default: unlock groups of three each day
            const unlockDay = Math.floor(index / 3) + 1;
            return dayOfEvent >= unlockDay;
        }

        return true;
    },

    // NEW: Enhanced completion validation
    canCompleteChallenge(userId, tileIndex, mode = 'regular') {
        // Check if challenge is available based on event timing
        if (!this.isChallengeAvailable(mode, tileIndex)) {
            return {
                allowed: false,
                reason: 'Challenge not yet available',
                type: 'temporal_lock'
            };
        }

        // Check for rapid completion patterns
        const now = Date.now();
        if (!this.lastActions[userId]) {
            this.lastActions[userId] = [];
        }
        
        // Clean old actions (older than 10 minutes)
        const tenMinutesAgo = now - (10 * 60 * 1000);
        this.lastActions[userId] = this.lastActions[userId].filter(t => t > tenMinutesAgo);

        // Check for too many rapid completions within the 10 minute window
        if (this.lastActions[userId].length > 25) {
            this.flagUser(userId, 'Too many rapid completions');
            return {
                allowed: false,
                reason: 'Please slow down - you\'re completing challenges too quickly',
                type: 'rate_limit'
            };
        }

        // Previously enforced per-challenge cooldowns are disabled

        return { allowed: true };
    },

    getMinimumInterval(mode, index) {
        return 0;
    },

    // UPDATED: Record completion with enhanced validation
    recordTileCompletion(userId, tileIndex, mode = 'regular') {
        const validation = this.canCompleteChallenge(userId, tileIndex, mode);
        
        if (!validation.allowed) {
            // Log the blocked attempt
            this.logEvent({
                type: 'blocked_attempt',
                userId,
                tileIndex,
                mode,
                reason: validation.reason,
                timestamp: Date.now()
            });
            
            return validation; // Return the validation result
        }

        // Record successful completion
        const now = Date.now();
        if (!this.lastActions[userId]) {
            this.lastActions[userId] = [];
        }
        this.lastActions[userId].push(now);

        // Update completion time for this specific challenge
        let userMap = this.userCompletionTimes.get(userId);
        if (!userMap) {
            userMap = new Map();
            this.userCompletionTimes.set(userId, userMap);
        }
        userMap.set(`${mode}:${tileIndex}`, now);

        this.logEvent({
            type: 'tile_complete',
            userId,
            tileIndex,
            mode,
            timestamp: now
        });

        return { allowed: true };
    },

    // Rest of existing methods stay the same...
    logEvent(event) {
        this.events.push(event);
        if (this.events.length > 1000) {
            this.events.shift();
        }

        if (typeof window !== 'undefined' && window.ValidationAnalytics &&
            typeof window.ValidationAnalytics.trackAntiCheat === 'function') {
            window.ValidationAnalytics.trackAntiCheat(event);
        }
    },

    flagUser(userId, reason) {
        // Validate userId
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.warn('Cannot flag invalid userId:', userId);
            return;
        }

        const cleanUserId = userId.trim();

        if (!this.flaggedUsers.has(cleanUserId)) {
            this.flaggedUsers.add(cleanUserId);
            this.logEvent({
                type: 'flag',
                userId: cleanUserId,
                reason,
                timestamp: Date.now()
            });

            // Persist flag to Firestore if available
            if (typeof window !== 'undefined' && window.FirebaseAntiCheat) {
                if (!window._firebaseAntiCheatInstance) {
                    window._firebaseAntiCheatInstance = new window.FirebaseAntiCheat();
                    if (window.firebaseApp) {
                        window._firebaseAntiCheatInstance.init(window.firebaseApp);
                    } else {
                        window.addEventListener('firebaseReady', () => {
                            window._firebaseAntiCheatInstance.init(window.firebaseApp);
                        }, { once: true });
                    }
                }
                const inst = window._firebaseAntiCheatInstance;
                if (inst.isAvailable()) {
                    inst.markUserFlagged(cleanUserId, reason).catch(err => {
                        // Silently handle errors - don't spam console
                    });
                } else {
                    window.addEventListener('firebaseReady', () => {
                        inst.init(window.firebaseApp).then(() => {
                            inst.markUserFlagged(cleanUserId, reason).catch(err => {
                                // Silently handle errors
                            });
                        });
                    }, { once: true });
                }
            }

            // Notify and reset progress when a user is flagged
            this.handleCheater(cleanUserId);
        }
    },

    // Display warning and clear user progress when cheating is detected
    handleCheater(userId) {
        if (typeof window === 'undefined') return;

        const message = 'Nice Try Silly Goose';
        if (window.Utils && typeof window.Utils.showNotification === 'function') {
            window.Utils.showNotification(message, 'error');
        } else {
            alert(message);
        }

        if (window.BingoTracker) {
            const tracker = window.BingoTracker;
            tracker.completedTiles.regular.clear();
            tracker.completedTiles.completionist.clear();
            tracker.subItemProgress = {};
            if (window.Storage) {
                window.Storage.clearAll();
            }
            tracker.saveProgress();
            tracker.renderGrid();
            tracker.updateStats();
        }
    },

    isFlagged(userId) {
        // Validate userId first
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            return false; // Don't warn for empty/invalid userIds, just return false
        }

        const cleanUserId = userId.trim();

        if (this.flaggedUsers.has(cleanUserId)) return true;

        if (typeof window !== 'undefined' && window._firebaseAntiCheatInstance && window._firebaseAntiCheatInstance.isAvailable()) {
            window._firebaseAntiCheatInstance.isUserFlagged(cleanUserId).then(isFlagged => {
                if (isFlagged) this.flaggedUsers.add(cleanUserId);
            }).catch((err) => {
                // Silently handle errors to prevent console spam
            });
        }

        return this.flaggedUsers.has(cleanUserId);
    },

    // NEW: Get remaining cooldown time for a challenge
    getRemainingCooldown(userId, tileIndex, mode = 'regular') {
        return 0;
    },

    // NEW: Get event status info
    getEventStatus() {
        return {
            isActive: this.eventConfig.isEventActive(),
            dayOfEvent: this.eventConfig.getDayOfEvent(),
            daysRemaining: Math.max(0, 8 - this.eventConfig.getDayOfEvent())
        };
    },

    async loadFlaggedUsersFromFirebase() {
        if (typeof window === 'undefined') return;
        if (!window.FirebaseAntiCheat) return;

        if (!window._firebaseAntiCheatInstance) {
            window._firebaseAntiCheatInstance = new window.FirebaseAntiCheat();
        }

        const inst = window._firebaseAntiCheatInstance;

        try {
            if (!inst.isAvailable()) {
                await inst.init(window.firebaseApp);
            }

            if (inst.isAvailable()) {
                const flagged = await inst.fetchFlaggedUsers();
                flagged.forEach(f => {
                    if (f.userId && typeof f.userId === 'string') {
                        this.flaggedUsers.add(f.userId.trim());
                    }
                });
            }
        } catch (err) {
            // Silently handle permission errors
            console.log('Anti-cheat system running in local mode (Firestore unavailable)');
        }
    }
};

// Initialize with enhanced rules
AntiCheatSystem.setupChallengeRules();

if (typeof window !== 'undefined') {
    window.AntiCheatSystem = AntiCheatSystem;

    window.addEventListener('firebaseReady', () => {
        AntiCheatSystem.loadFlaggedUsersFromFirebase();
    });

    if (window.firebaseApp) {
        AntiCheatSystem.loadFlaggedUsersFromFirebase();
    }
}

if (typeof module !== 'undefined') {
    module.exports = AntiCheatSystem;
}
