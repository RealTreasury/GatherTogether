/* Integration between BingoTracker and AntiCheatSystem */
(function() {
    if (typeof window === 'undefined') return;
    const tracker = window.BingoTracker;
    const ac = window.AntiCheatSystem;
    if (!tracker || !ac) return;

    const originalToggle = tracker.toggleTile;
    tracker.toggleTile = function(index) {
        const userId = window.Utils && typeof Utils.getUserId === 'function'
            ? Utils.getUserId()
            : 'anonymous';
        ac.recordTileCompletion(userId, index, tracker.currentMode || 'regular');
        return originalToggle.call(tracker, index);
    };
})();
