// Hard Mode 15 Session Challenge with time-based unlocks

const HardMode = {
    sessions: [],
    executedReleases: [],
    schedule: [],

    init() {
        // Load progress and executed releases
        const storedSessions = Storage.load(Storage.KEYS.HARDMODE_SESSIONS, []);
        const storedReleases = Storage.load(Storage.KEYS.HARDMODE_RELEASES, []);
        HardMode.sessions = Array.isArray(storedSessions) ? storedSessions : [];
        HardMode.executedReleases = Array.isArray(storedReleases) ? storedReleases : [];

        HardMode.buildSchedule();
        HardMode.updateProgress();
        HardMode.checkSchedule();
        // Check every minute
        setInterval(HardMode.checkSchedule, 60 * 1000);
    },

    buildSchedule() {
        // Base dates for 3 day challenge (Central Time)
        const day1 = new Date('2025-07-20T10:00:00-05:00'); // Sunday
        const day2 = new Date('2025-07-21T10:00:00-05:00');
        const day3 = new Date('2025-07-22T10:00:00-05:00');

        HardMode.schedule = [
            { time: day1, action: 'start' },
            { time: new Date('2025-07-20T18:00:00-05:00'), action: 'day1Evening' },
            { time: day2, action: 'day2Morning' },
            { time: new Date('2025-07-21T14:00:00-05:00'), action: 'day2Afternoon' },
            { time: new Date('2025-07-21T18:00:00-05:00'), action: 'day2Evening' },
            { time: day3, action: 'day3Morning' },
            { time: new Date('2025-07-22T13:00:00-05:00'), action: 'day3Midday' }
        ];
    },

    addSession(session) {
        if (!HardMode.sessions.includes(session)) {
            HardMode.sessions.push(session);
            HardMode.save();
            HardMode.updateProgress();
            HardMode.checkCompletion();
        }
    },

    updateProgress() {
        const countEl = document.getElementById('hardmode-count');
        if (countEl) {
            countEl.textContent = HardMode.sessions.length.toString();
        }
    },

    checkSchedule() {
        const now = new Date();
        HardMode.schedule.forEach((item, idx) => {
            if (!HardMode.executedReleases.includes(idx) && now >= item.time) {
                HardMode.executedReleases.push(idx);
                HardMode.save();
                HardMode.handleAction(item.action);
            }
        });
    },

    handleAction(action) {
        switch (action) {
            case 'start':
                Utils.showNotification('Hard Mode Challenge unlocked!');
                HardMode.showProgress(true);
                break;
            case 'day1Evening':
                HardMode.day1ProgressCheck();
                break;
            case 'day2Morning':
                HardMode.showTracker();
                break;
            case 'day2Afternoon':
                Utils.showNotification('Mid-day check in!');
                break;
            case 'day2Evening':
                HardMode.day2ProgressCheck();
                break;
            case 'day3Morning':
                Utils.showNotification('Final day!');
                break;
            case 'day3Midday':
                Utils.showNotification('Keep pushing to finish!');
                break;
            default:
                break;
        }
    },

    day1ProgressCheck() {
        const count = HardMode.sessions.length;
        if (count >= 5) {
            Utils.showNotification('Day 1 Warrior badge unlocked!');
        } else if (count >= 3) {
            Utils.showNotification('Good Start!');
        } else {
            Utils.showNotification('Catch Up Tomorrow!', 'warning');
        }
    },

    day2ProgressCheck() {
        const count = HardMode.sessions.length;
        if (count >= 10) {
            Utils.showNotification('Two-Day Champion badge unlocked!');
        } else if (count >= 7) {
            Utils.showNotification('Push Mode Activated');
        } else {
            Utils.showNotification('Redemption Path scheduled', 'warning');
        }
    },

    showProgress(show) {
        const container = document.getElementById('hardmode-progress');
        if (container) {
            container.classList.toggle('hidden', !show);
        }
    },

    showTracker() {
        HardMode.showProgress(true);
        Utils.showNotification('Progress tracker unlocked!');
    },

    checkCompletion() {
        const count = HardMode.sessions.length;
        if (count >= 15) {
            if (!HardMode.executedReleases.includes('complete')) {
                HardMode.executedReleases.push('complete');
                HardMode.save();
                Utils.showNotification('Hard Mode Champion badge unlocked!');
            }
        }
    },

    save() {
        Storage.save(Storage.KEYS.HARDMODE_SESSIONS, HardMode.sessions);
        Storage.save(Storage.KEYS.HARDMODE_RELEASES, HardMode.executedReleases);
    }
};

if (typeof window !== 'undefined') {
    window.HardMode = HardMode;
}
