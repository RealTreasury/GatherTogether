/* Anti-Cheat monitoring system */

const AntiCheatSystem = {
    events: [],
    flaggedUsers: new Set(),
    lastActions: {},
    minimumIntervals: new Map(),
    userCompletionTimes: new Map(),

    setupChallengeRules() {
        this.minimumIntervals.clear();
        // Regular challenges (in minutes)
        this.minimumIntervals.set('regular', new Map([
            [0, 15],   // Selfie at entrance - 15 min
            [1, 30],   // Learn someone's name - 30 min
            // ... customize as needed
        ]));

        // Completionist challenges (in hours)
        this.minimumIntervals.set('completionist', new Map([
            [0, 24],   // Meet all 50 states - 24 hours
            [1, 12],   // Meet 5 countries - 12 hours
            // ... customize as needed
        ]));
    },

    getMinimumInterval(mode, index) {
        const m = this.minimumIntervals.get(mode);
        if (!m) return 0;
        const val = m.get(index);
        if (!val) return 0;
        return mode === 'regular' ? val * 60 * 1000 : val * 60 * 60 * 1000;
    },

    recordTileCompletion(userId, tileIndex, mode = 'regular') {
        const now = Date.now();
        if (!this.lastActions[userId]) {
            this.lastActions[userId] = [];
        }
        this.lastActions[userId].push(now);
        const timeframe = 30000; // 30 seconds window
        this.lastActions[userId] = this.lastActions[userId].filter(t => now - t < timeframe);
        if (this.lastActions[userId].length > 15) {
            this.flagUser(userId, 'Excessive rapid completions');
        }

        const allowed = this.getMinimumInterval(mode, tileIndex);
        if (allowed > 0) {
            let userMap = this.userCompletionTimes.get(userId);
            if (!userMap) {
                userMap = new Map();
                this.userCompletionTimes.set(userId, userMap);
            }
            const last = userMap.get(`${mode}:${tileIndex}`) || 0;
            if (now - last < allowed) {
                this.flagUser(userId, 'Completed challenge too quickly');
            }
            userMap.set(`${mode}:${tileIndex}`, now);
        }

        this.logEvent({
            type: 'tile_complete',
            userId,
            tileIndex,
            timestamp: now
        });
    },

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
    }
};

AntiCheatSystem.setupChallengeRules();

if (typeof window !== 'undefined') {
    window.AntiCheatSystem = AntiCheatSystem;
}

if (typeof module !== 'undefined') {
    module.exports = AntiCheatSystem;
}
