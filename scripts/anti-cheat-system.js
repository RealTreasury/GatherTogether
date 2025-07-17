/* Anti-Cheat monitoring system */

class AntiCheatSystem {
    constructor() {
        this.events = [];
        this.flaggedUsers = new Set();
        this.lastActions = {};
        this.maxEvents = 1000;
        this.timeframe = 30000; // 30 seconds
        this.maxActionsPerTimeframe = 15;
    }

    recordTileCompletion(userId, tileIndex) {
        const now = Date.now();
        if (!this.lastActions[userId]) {
            this.lastActions[userId] = [];
        }
        this.lastActions[userId].push(now);
        this.lastActions[userId] = this.lastActions[userId].filter(t => now - t < this.timeframe);
        if (this.lastActions[userId].length > this.maxActionsPerTimeframe) {
            this.flagUser(userId, 'Excessive rapid completions');
        }
        this.logEvent({ type: 'tile_complete', userId, tileIndex, timestamp: now });
    }

    logEvent(event) {
        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        if (typeof window !== 'undefined' &&
            window.ValidationAnalytics &&
            typeof window.ValidationAnalytics.trackAntiCheat === 'function') {
            window.ValidationAnalytics.trackAntiCheat(event);
        }
    }

    flagUser(userId, reason) {
        if (!this.flaggedUsers.has(userId)) {
            this.flaggedUsers.add(userId);
            this.logEvent({ type: 'flag', userId, reason, timestamp: Date.now() });
        }
    }

    isFlagged(userId) {
        return this.flaggedUsers.has(userId);
    }

    getEventLog() {
        return this.events.slice();
    }

    reset() {
        this.events = [];
        this.flaggedUsers.clear();
        this.lastActions = {};
    }
}

if (typeof window !== 'undefined') {
    window.AntiCheatSystem = new AntiCheatSystem();
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    module.exports = AntiCheatSystem;
}
