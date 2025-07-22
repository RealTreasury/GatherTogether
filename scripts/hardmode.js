// Hard Mode 15 Session Challenge

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
        HardMode.showProgress(true);
        HardMode.checkSchedule();
        // Check every minute (harmless if schedule empty)
        setInterval(HardMode.checkSchedule, 60 * 1000);
    },

    buildSchedule() {
        // Time locks removed - no scheduled releases
        HardMode.schedule = [];
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
                HardMode.handleAction(item.action, idx, item.points);
            }
        });
    },

    handleAction(action, idx, points = 0) {
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

        for (let i = 0; i < points; i++) {
            HardMode.addSession(`auto-${idx}-${i}`);
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
