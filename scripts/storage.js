export function saveState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Could not save state:', e);
    }
}

export function loadState(key, fallback = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn('Could not load state:', e);
        return fallback;
    }
}

window.storage = { saveState, loadState };
