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

const BingoTracker = {
    completedTiles: new Set(),
    dailyChallenge: 0,
    gridSize: 5,

    // Initialize bingo tracker
    init: () => {
        BingoTracker.loadProgress();
        BingoTracker.setDailyChallenge();
        BingoTracker.renderGrid();
        BingoTracker.updateStats();
    },

    // Render the bingo grid
    renderGrid: () => {
        const grid = document.getElementById('bingo-grid');
        if (!grid) return;

        grid.innerHTML = '';
        
        BINGO_CHALLENGES.forEach((challenge, index) => {
            const tile = document.createElement('div');
            tile.className = 'bingo-tile';
            tile.setAttribute('data-index', index);
            
            if (BingoTracker.completedTiles.has(index)) {
                tile.classList.add('completed');
            }
            
            if (index === BingoTracker.dailyChallenge) {
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

        if (BingoTracker.completedTiles.has(index)) {
            // Uncomplete
            BingoTracker.completedTiles.delete(index);
            tile.classList.remove('completed');
            tile.style.animation = 'none';
        } else {
            // Complete
            BingoTracker.completedTiles.add(index);
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
        const size = BingoTracker.gridSize;
        
        // Check rows
        for (let row = 0; row < size; row++) {
            let complete = true;
            for (let col = 0; col < size; col++) {
                if (!BingoTracker.completedTiles.has(row * size + col)) {
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
                if (!BingoTracker.completedTiles.has(row * size + col)) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        
        // Check diagonals
        let diagonal1 = true, diagonal2 = true;
        for (let i = 0; i < size; i++) {
            if (!BingoTracker.completedTiles.has(i * size + i)) diagonal1 = false;
            if (!BingoTracker.completedTiles.has(i * size + (size - 1 - i))) diagonal2 = false;
        }
        
        return diagonal1 || diagonal2;
    },

    // Count bingo lines
    countBingoLines: () => {
        const size = BingoTracker.gridSize;
        let count = 0;
        
        // Check rows
        for (let row = 0; row < size; row++) {
            let complete = true;
            for (let col = 0; col < size; col++) {
                if (!BingoTracker.completedTiles.has(row * size + col)) {
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
                if (!BingoTracker.completedTiles.has(row * size + col)) {
                    complete = false;
                    break;
                }
            }
            if (complete) count++;
        }
        
        // Check diagonals
        let diagonal1 = true, diagonal2 = true;
        for (let i = 0; i < size; i++) {
            if (!BingoTracker.completedTiles.has(i * size + i)) diagonal1 = false;
            if (!BingoTracker.completedTiles.has(i * size + (size - 1 - i))) diagonal2 = false;
        }
        if (diagonal1) count++;
        if (diagonal2) count++;
        
        return count;
    },

    // Show celebration
    showCelebration: () => {
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-3xl font-bold text-purple-600 mb-2">BINGO!</h3>
                <p class="text-gray-600 mb-6">Amazing! You've completed a line of faith challenges!</p>
                <button class="btn-primary" onclick="BingoTracker.closeCelebration()">Continue</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add confetti
        Utils.createConfetti();
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            BingoTracker.closeCelebration();
        }, 5000);
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
        const completedCount = BingoTracker.completedTiles.size;
        const totalCount = BINGO_CHALLENGES.length;
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
        Storage.save(Storage.KEYS.BINGO_PROGRESS, [...BingoTracker.completedTiles]);
    },

    // Load progress
    loadProgress: () => {
        const saved = Storage.load(Storage.KEYS.BINGO_PROGRESS, []);
        BingoTracker.completedTiles = new Set(saved);
    },

    // Reset progress
    reset: () => {
        if (confirm('Are you sure you want to reset all progress?')) {
            BingoTracker.completedTiles.clear();
            BingoTracker.saveProgress();
            BingoTracker.renderGrid();
            BingoTracker.updateStats();
            Utils.showNotification('Progress reset successfully!');
        }
    }
};
