/* Enhanced Integration between BingoTracker and AntiCheatSystem */
(function() {
    if (typeof window === 'undefined') return;
    const tracker = window.BingoTracker;
    const ac = window.AntiCheatSystem;
    if (!tracker || !ac) return;

    // Store original function
    const originalToggle = tracker.toggleTile;
    
    // Enhanced toggle function with anti-cheat validation
    tracker.toggleTile = function(index) {
        const userId = window.Utils && typeof Utils.getUserId === 'function'
            ? Utils.getUserId()
            : 'anonymous';
        
        const mode = tracker.currentMode || 'regular';
        const completedSet = tracker.completedTiles[mode];
        
        // If trying to complete a challenge (not uncomplete)
        if (!completedSet.has(index)) {
            // Check anti-cheat validation
            const validation = ac.canCompleteChallenge(userId, index, mode);
            
            if (!validation.allowed) {
                // Show user-friendly error message
                let message = validation.reason;
                
                if (validation.type === 'temporal_lock') {
                    const eventStatus = ac.getEventStatus();
                    if (eventStatus.dayOfEvent < 1) {
                        message = `Challenges unlock on July 17th, 2025! Check back during the Youth Gathering.`;
                    } else if (mode === 'completionist') {
                        message = `This Hard Mode challenge unlocks later in the event. Keep checking back!`;
                    }
                } else if (validation.type === 'cooldown') {
                    let friendly = `${Math.ceil(validation.remainingTime / (1000 * 60))} minutes`;
                    if (window.Utils && typeof Utils.formatDuration === 'function') {
                        friendly = Utils.formatDuration(validation.remainingTime);
                    }
                    message = `Please wait ${friendly} before completing this challenge.`;
                } else if (validation.type === 'rate_limit') {
                    message = `Slow down there, speed racer! 🏃‍♂️ Take time to truly experience each challenge.`;
                }
                
                // Show notification
                if (window.Utils && Utils.showNotification) {
                    Utils.showNotification(message, 'warning');
                } else {
                    alert(message);
                }
                
                // Update visual state to show challenge is locked
                tracker.updateChallengeVisualState(index, validation);
                return false; // Prevent completion
            }
            
            // Record successful completion
            ac.recordTileCompletion(userId, index, mode);
        }
        
        // Proceed with original toggle logic
        return originalToggle.call(tracker, index);
    };

    // NEW: Update visual state of challenges based on anti-cheat rules
    tracker.updateChallengeVisualState = function(index, validation) {
        const tile = document.querySelector(`[data-index="${index}"]`);
        if (!tile) return;
        
        // Remove existing state classes
        tile.classList.remove('locked', 'on-cooldown', 'newly-unlocked');
        
        // Add appropriate state class
        if (validation && !validation.allowed) {
            if (validation.type === 'temporal_lock') {
                tile.classList.add('locked');
                tracker.showLockIcon(tile);
            } else if (validation.type === 'cooldown') {
                // Cooldown visuals have been removed
            }
        }
    };

    // NEW: Show lock icon on locked challenges
    tracker.showLockIcon = function(tile) {
        let lockIcon = tile.querySelector('.lock-icon');
        if (!lockIcon) {
            lockIcon = document.createElement('div');
            lockIcon.className = 'lock-icon';
            lockIcon.innerHTML = '🔒';
            lockIcon.setAttribute('aria-label', 'Challenge locked');
            tile.appendChild(lockIcon);
        }
    };


    // NEW: Enhanced render grid to apply anti-cheat state
    const originalRenderGrid = tracker.renderGrid;
    tracker.renderGrid = function() {
        // Call original render
        originalRenderGrid.call(tracker);
        
        // Apply anti-cheat visual states
        tracker.applyAntiCheatStates();
    };

    // NEW: Apply anti-cheat visual states to all tiles
    tracker.applyAntiCheatStates = function() {
        const userId = window.Utils && typeof Utils.getUserId === 'function'
            ? Utils.getUserId()
            : 'anonymous';
        
        const mode = tracker.currentMode || 'regular';
        const challenges = tracker.getCurrentChallenges();
        
        challenges.forEach((challenge, index) => {
            const validation = ac.canCompleteChallenge(userId, index, mode);
            tracker.updateChallengeVisualState(index, validation);
        });
    };

    // NEW: Add event status indicator
    tracker.showEventStatus = function() {
        const eventStatus = ac.getEventStatus();
        const statusContainer = document.getElementById('event-status');
        
        if (statusContainer) {
            if (eventStatus.isActive) {
                statusContainer.innerHTML = `
                    <div class="text-center text-green-600">
                        🎉 Youth Gathering Day ${eventStatus.dayOfEvent} is LIVE!
                    </div>
                `;
            } else if (eventStatus.dayOfEvent < 1) {
                const daysUntil = Math.ceil((ac.eventConfig.startDate - new Date()) / (1000 * 60 * 60 * 24));
                statusContainer.innerHTML = `
                    <div class="text-center text-blue-600">
                        ⏰ Challenges unlock in ${daysUntil} days (July 17th)
                    </div>
                `;
            } else {
                statusContainer.innerHTML = `
                    <div class="text-center text-gray-600">
                        📚 Youth Gathering 2025 has concluded
                    </div>
                `;
            }
        }
    };

    // Initialize enhanced states on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                tracker.applyAntiCheatStates();
                tracker.showEventStatus();
            }, 100);
        });
    } else {
        tracker.applyAntiCheatStates();
        tracker.showEventStatus();
    }

    console.log('✅ Enhanced anti-cheat integration loaded');
})();
