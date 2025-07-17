/* Anti-Cheat monitoring system */

const AntiCheatSystem = {
    events: [],
    flaggedUsers: new Set(),
    lastActions: {},

    recordTileCompletion(userId, tileIndex) {
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

if (typeof window !== 'undefined') {
    window.AntiCheatSystem = AntiCheatSystem;
}

if (typeof module !== 'undefined') {
    module.exports = AntiCheatSystem;
}
