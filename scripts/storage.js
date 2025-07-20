// Local storage utilities

const Storage = {
    // Keys for different data types
    KEYS: {
        BINGO_PROGRESS_REGULAR: 'bingoProgressRegular',
        BINGO_PROGRESS_COMPLETIONIST: 'bingoProgressCompletionist',
        BINGO_SUBITEMS_COMPLETIONIST: 'bingoSubItemsCompletionist',
        FAVORITE_VERSES: 'favoriteVerses',
        POLL_RESPONSES: 'pollResponses',
        USER_PREFERENCES: 'userPreferences',
        HARDMODE_SESSIONS: 'hardModeSessions',
        HARDMODE_RELEASES: 'hardModeReleases'
    },

    // Save data to localStorage
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
            return false;
        }
    },

    // Load data from localStorage
    load: (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
            return defaultValue;
        }
    },

    // Remove data from localStorage
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Could not remove from localStorage:', error);
            return false;
        }
    },

    // Clear all app data
    clearAll: () => {
        Object.values(Storage.KEYS).forEach(key => {
            Storage.remove(key);
        });
    },

    // Get storage usage info
    getStorageInfo: () => {
        const used = JSON.stringify(localStorage).length;
        const quota = 5 * 1024 * 1024; // 5MB typical quota
        return {
            used,
            quota,
            percentage: (used / quota) * 100
        };
    }
};
