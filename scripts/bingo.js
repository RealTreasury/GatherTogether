// Bingo tracker functionality

const BINGO_CHALLENGES = [
    "Share your faith story",
    "Pray for a friend",
    "Read John 3:16",
    "Help a stranger",
    "Attend worship",
    "Join a Bible study",
    "Thank a volunteer",
    "Make a new friend",
    "Sing a hymn",
    "Share a meal",
    "Give encouragement",
    "Practice forgiveness",
    "Show kindness",
    "Learn a verse",
    "Serve others",
    "Share testimony",
    "Invite someone",
    "Practice gratitude",
    "Listen deeply",
    "Show compassion",
    "Spread joy",
    "Be patient",
    "Offer help",
    "Share hope",
    "Love neighbor"
];

const COMPLETIONIST_CHALLENGES = [
    "Meet someone from all 50 states",
    "Meet people from 5 different countries",
    "Collect all district booth prizes",
    "Compete in every convention center game",
    "Attend 15+ sessions/workshops",
    "Take photos at all major landmarks",
    "Volunteer for 3+ service opportunities",
    "Get autographs from all guest speakers",
    "Participate in every worship service",
    "Lead a prayer circle with strangers",
    "Exchange contacts with 25+ new friends",
    "Document journey with 100+ photos",
    "Learn 5 new hymns/songs by heart",
    "Share testimony in 3 different venues",
    "Complete daily random acts of kindness",
    "Fast for a meal and donate savings"
];

const BingoTracker = {
    currentMode: 'regular',
    completedTiles: {
        regular: new Set(),
        completionist: new Set()
    },
    dailyChallenge: 0,

    // Initialize bingo tracker
    init: () => {
        BingoTracker.loadProgress();
        BingoTracker.setDailyChallenge();
        BingoTracker.initCardSelector();
        BingoTracker.renderGrid();
        BingoTracker.updateStats();
    },

    initCardSelector: () => {
        const buttons = document.querySelectorAll('.card-type-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                BingoTracker.currentMode = btn.dataset.type;
                BingoTracker.renderGrid();
                BingoTracker.updateStats();
            });
        });
    },

    getCurrentChallenges: () => {
        return BingoTracker.currentMode === 'regular' ? BINGO_CHALLENGES : COMPLETIONIST_CHALLENGES;
    },

    getGridSize: () => {
        return BingoTracker.currentMode === 'regular' ? 5 : 4;
    },

    // Render the bingo grid
    renderGrid: () => {
        const grid = document.getElementById('bingo-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const challenges = BingoTracker.getCurrentChallenges();
        const completedSet = BingoTracker.completedTiles[BingoTracker.currentMode];
        grid.className = `bingo-grid ${BingoTracker.currentMode} mb-6`;

        challenges.forEach((challenge, index) => {
            const tile = document.createElement('div');
            tile.className = `bingo-tile ${BingoTracker.currentMode}`;
            tile.setAttribute('data-index', index);

            if (completedSet.has(index)) {
                tile.classList.add('completed');
            }

            if (index === BingoTracker.dailyChallenge && BingoTracker.currentMode === 'regular') {
                tile.classList.add('daily-challenge');
            }

            tile.innerHTML = `<div class="bingo-tile-text">${challenge}</div>`;
            tile.addEventListener('click', () => BingoTracker.toggleTile(index));

            grid.appendChild(tile);
        });
    },

    // Toggle tile completion
    toggleTile: (index) => {
        const tile = document.querySelector(`[data-index="${index}"]`);
        if (!tile) return;

        const completedSet = BingoTracker.completedTiles[BingoTracker.currentMode];

        if (completedSet.has(index)) {
            // Uncomplete
            completedSet.delete(index);
            tile.classList.remove('completed');
            tile.style.animation = 'none';
        } else {
            // Complete
            completedSet.add(index);
            tile.classList.add('completed');
            tile.style.animation = 'bounceIn 0.6s ease';
            
            // Check for bingo
            if (BingoTracker.checkForBingo()) {
                setTimeout(() => BingoTracker.showCelebration(), 300);
            }
        }
        
        BingoTracker.saveProgress();
        BingoTracker.updateStats();
    },

    // Check for bingo lines
    checkForBingo: () => {
        const size = BingoTracker.getGridSize();
        const completedSet = BingoTracker.completedTiles[BingoTracker.currentMode];
        
        // Check rows
        for (let row = 0; row < size; row++) {
            let complete = true;
            for (let col = 0; col < size; col++) {
                if (!completedSet.has(row * size + col)) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        
        // Check columns
        for (let col = 0; col < size; col++) {
            let complete = true;
            for (let row = 0; row < size; row++) {
                if (!completedSet.has(row * size + col)) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        
        // Check diagonals
        let diagonal1 = true, diagonal2 = true;
        for (let i = 0; i < size; i++) {
            if (!completedSet.has(i * size + i)) diagonal1 = false;
            if (!completedSet.has(i * size + (size - 1 - i))) diagonal2 = false;
        }
        
        return diagonal1 || diagonal2;
    },

    // Count bingo lines
    countBingoLines: () => {
        const size = BingoTracker.getGridSize();
        const completedSet = BingoTracker.completedTiles[BingoTracker.currentMode];
        let count = 0;
        
        // Check rows
        for (let row = 0; row < size; row++) {
            let complete = true;
            for (let col = 0; col < size; col++) {
                if (!completedSet.has(row * size + col)) {
                    complete = false;
                    break;
                }
            }
            if (complete) count++;
        }
        
        // Check columns
        for (let col = 0; col < size; col++) {
            let complete = true;
            for (let row = 0; row < size; row++) {
                if (!completedSet.has(row * size + col)) {
                    complete = false;
                    break;
                }
            }
            if (complete) count++;
        }
        
        // Check diagonals
        let diagonal1 = true, diagonal2 = true;
        for (let i = 0; i < size; i++) {
            if (!completedSet.has(i * size + i)) diagonal1 = false;
            if (!completedSet.has(i * size + (size - 1 - i))) diagonal2 = false;
        }
        if (diagonal1) count++;
        if (diagonal2) count++;
        
        return count;
    },

    // Show celebration
    showCelebration: () => {
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        const title = BingoTracker.currentMode === 'completionist' ? 'LEGENDARY BINGO!' : 'BINGO!';
        const emoji = BingoTracker.currentMode === 'completionist' ? '🏆' : '🎉';
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="text-6xl mb-4">${emoji}</div>
                <h3 class="text-3xl font-bold text-purple-600 mb-2">${title}</h3>
                <p class="text-gray-600 mb-6">Amazing! You've completed a line of ${BingoTracker.currentMode} challenges!</p>
                <button class="btn-primary" onclick="BingoTracker.closeCelebration()">Continue</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Add confetti
        Utils.createConfetti(BingoTracker.currentMode === 'completionist' ? 200 : 100);

        // Auto-close after 5 seconds (longer for completionist)
        setTimeout(() => {
            BingoTracker.closeCelebration();
        }, BingoTracker.currentMode === 'completionist' ? 7000 : 5000);
    },

    // Close celebration
    closeCelebration: () => {
        const overlay = document.querySelector('.celebration-overlay');
        if (overlay) {
            overlay.remove();
        }
        Utils.removeConfetti();
    },

    // Update statistics
    updateStats: () => {
        const completedCount = BingoTracker.completedTiles[BingoTracker.currentMode].size;
        const totalCount = BingoTracker.getCurrentChallenges().length;
        const progressPercent = Math.round((completedCount / totalCount) * 100);
        const bingoLines = BingoTracker.countBingoLines();
        
        const elements = {
            'completed-count': completedCount,
            'progress-percent': progressPercent + '%',
            'bingo-count': bingoLines
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    },

    // Set daily challenge
    setDailyChallenge: () => {
        const dayOfYear = Utils.getDayOfYear();
        BingoTracker.dailyChallenge = dayOfYear % BINGO_CHALLENGES.length;
    },

    // Save progress
    saveProgress: () => {
        const key = BingoTracker.currentMode === 'regular'
            ? Storage.KEYS.BINGO_PROGRESS_REGULAR
            : Storage.KEYS.BINGO_PROGRESS_COMPLETIONIST;
        Storage.save(key, [...BingoTracker.completedTiles[BingoTracker.currentMode]]);
    },

    // Load progress
    loadProgress: () => {
        const regular = Storage.load(Storage.KEYS.BINGO_PROGRESS_REGULAR, []);
        const completionist = Storage.load(Storage.KEYS.BINGO_PROGRESS_COMPLETIONIST, []);
        BingoTracker.completedTiles.regular = new Set(regular);
        BingoTracker.completedTiles.completionist = new Set(completionist);
    },

    // Reset progress
    reset: () => {
        if (confirm(`Are you sure you want to reset all ${BingoTracker.currentMode} progress?`)) {
            BingoTracker.completedTiles[BingoTracker.currentMode].clear();
            BingoTracker.saveProgress();
            BingoTracker.renderGrid();
            BingoTracker.updateStats();
            Utils.showNotification('Progress reset successfully!');
        }
    },

    shareProgress: () => {
        const completedCount = BingoTracker.completedTiles[BingoTracker.currentMode].size;
        const totalCount = BingoTracker.getCurrentChallenges().length;
        const progressPercent = Math.round((completedCount / totalCount) * 100);
        const mode = BingoTracker.currentMode === 'completionist' ? 'Completionist' : 'Regular';

        const shareText = `I'm ${progressPercent}% done with my ${mode} Faith Challenge Bingo at #LCMSGathering2025!`;

        if (navigator.share) {
            navigator.share({
                title: 'GatherTogether - Faith Challenge Progress',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            Utils.showNotification('Progress copied to clipboard!');
        }
    }
};
