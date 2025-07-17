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
        startDate: new Date('2025-07-19T00:00:00'), // July 19, 2025
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
            [0, 15],   // Selfie at entrance - 15 min
            [1, 30],   // Learn someone's name - 30 min
            [2, 5],    // Attend opening worship - 5 min
            [3, 20],   // Visit 3 booths - 20 min
            [4, 45],   // Service project - 45 min
            [5, 10],   // Chicken dance - 10 min
            [6, 30],   // Memorize verse - 30 min
            [7, 5],    // Take communion - 5 min
            [8, 15],   // Ask speaker question - 15 min
            [9, 60],   // Exchange contact info - 60 min
            [10, 30],  // Attend breakout session - 30 min
            [11, 20],  // Pray with someone - 20 min
            [12, 15],  // Try food trucks - 15 min
            [13, 10],  // Group photo - 10 min
            [14, 20],  // Visit prayer station - 20 min
            [15, 30],  // Share experience - 30 min
            [16, 5],   // Attend Mass Event Plus - 5 min
            [17, 15],  // Write encouragement note - 15 min
            [18, 25],  // Learn worship song - 25 min
            [19, 10],  // Visit LCMS booth - 10 min
            [20, 20],  // Large group games - 20 min
            [21, 45],  // Share meal with group - 45 min
            [22, 30],  // Take notes during session - 30 min
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
            [8, 168],  // Every worship service - 7 days
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
            // Regular challenges unlock progressively
            // Days 1-2: All challenges available
            // This is more permissive than strict day-by-day unlocking
            return dayOfEvent >= 1;
        } else if (mode === 'completionist') {
            // Completionist challenges have stricter unlocking
            const unlockDay = Math.floor(index / 3) + 1; // Every 3 challenges unlock per day
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
        
        // Clean old actions (older than 5 minutes)
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        this.lastActions[userId] = this.lastActions[userId].filter(t => t > fiveMinutesAgo);
        
        // Check for too many rapid completions
        if (this.lastActions[userId].length >= 10) {
            this.flagUser(userId, 'Too many rapid completions');
            return {
                allowed: false,
                reason: 'Please slow down - you\'re completing challenges too quickly',
                type: 'rate_limit'
            };
        }

        // Check minimum time interval for this specific challenge
        const minInterval = this.getMinimumInterval(mode, tileIndex);
        if (minInterval > 0) {
            let userMap = this.userCompletionTimes.get(userId);
            if (!userMap) {
                userMap = new Map();
                this.userCompletionTimes.set(userId, userMap);
            }
            
            const challengeKey = `${mode}:${tileIndex}`;
            const lastCompletion = userMap.get(challengeKey) || 0;
            const timeSinceLastCompletion = now - lastCompletion;
            
            if (timeSinceLastCompletion < minInterval) {
                const remainingTime = minInterval - timeSinceLastCompletion;
                const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
                
                return {
                    allowed: false,
                    reason: `Please wait ${remainingMinutes} more minutes before completing this challenge again`,
                    type: 'cooldown',
                    remainingTime: remainingTime
                };
            }
        }

        return { allowed: true };
    },

    getMinimumInterval(mode, index) {
        const m = this.minimumIntervals.get(mode);
        if (!m) return 0;
        const val = m.get(index);
        if (!val) return 0;
        return mode === 'regular' ? val * 60 * 1000 : val * 60 * 60 * 1000;
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
        if (!this.flaggedUsers.has(userId)) {
            this.flaggedUsers.add(userId);
            this.logEvent({
                type: 'flag',
                userId,
                reason,
                timestamp: Date.now()
            });
        }
    },

    isFlagged(userId) {
        return this.flaggedUsers.has(userId);
    },

    // NEW: Get remaining cooldown time for a challenge
    getRemainingCooldown(userId, tileIndex, mode = 'regular') {
        const validation = this.canCompleteChallenge(userId, tileIndex, mode);
        if (validation.type === 'cooldown') {
            return validation.remainingTime;
        }
        return 0;
    },

    // NEW: Get event status info
    getEventStatus() {
        return {
            isActive: this.eventConfig.isEventActive(),
            dayOfEvent: this.eventConfig.getDayOfEvent(),
            daysRemaining: Math.max(0, 8 - this.eventConfig.getDayOfEvent())
        };
    }
};

// Initialize with enhanced rules
AntiCheatSystem.setupChallengeRules();

if (typeof window !== 'undefined') {
    window.AntiCheatSystem = AntiCheatSystem;
}

if (typeof module !== 'undefined') {
    module.exports = AntiCheatSystem;
}
