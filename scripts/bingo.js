// Bingo tracker functionality

const BINGO_CHALLENGES = [
    "Take a selfie at the gathering entrance",
    "Learn someone's name from a different state",
    "Attend the opening worship service",
    "Visit 3 different exhibitor booths",
    "Participate in a service project",
    "Share your testimony during small group and plan to share it again at home",
    "Memorize the gathering theme verse",
    "Take communion at morning worship",
    "Ask a speaker a question during Q&A",
    "Exchange contact info with 5 new friends",
    "Attend a breakout session on missions",
    "Pray with someone you just met",
    "Try food from the local food trucks",
    "Take a group photo with your youth group",
    "Visit the prayer station and set a reminder to pray daily at home",
    "Share your experience with someone from your church and someone not from your church at home",
    "Attend evening worship under the stars",
    "Write an encouragement note to mail home",
    "Learn a new worship song to teach your family back home",
    "Visit the LCMS booth",
    "Participate in the large group games",
    "Share a meal with another youth group",
    "Take notes during a main session and review them when you get home",
    "Post about the gathering on social media",
    "Give a high-five to 10 different people"
];

const US_STATES = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
    'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

const COMPLETIONIST_CHALLENGES = [
    { text: 'Meet someone from all 50 states', sublist: US_STATES },
    { text: 'Meet people from 5 different countries', sublist: Array.from({length:5},(_,i)=>`Country ${i+1}`) },
    { text: 'Collect all district booth prizes', sublist: Array.from({length:10},(_,i)=>`Prize ${i+1}`) },
    { text: 'Compete in every convention center game', sublist: Array.from({length:8},(_,i)=>`Game ${i+1}`) },
    { text: 'Attend 15+ sessions/workshops', sublist: Array.from({length:15},(_,i)=>`Session ${i+1}`) },
    { text: 'Take photos at all major landmarks', sublist: Array.from({length:10},(_,i)=>`Landmark ${i+1}`) },
    { text: 'Volunteer for 3+ service opportunities', sublist: Array.from({length:3},(_,i)=>`Service ${i+1}`) },
    { text: 'Get autographs from all guest speakers', sublist: Array.from({length:5},(_,i)=>`Speaker ${i+1}`) },
    { text: 'Participate in every worship service', sublist: Array.from({length:5},(_,i)=>`Service ${i+1}`) },
    { text: 'Lead a prayer circle with strangers' },
    { text: 'Exchange contacts with 25+ new friends', sublist: Array.from({length:25},(_,i)=>`Friend ${i+1}`) },
    { text: 'Document journey with 100+ photos', sublist: Array.from({length:100},(_,i)=>`Photo ${i+1}`) },
    { text: 'Learn 5 new hymns/songs by heart', sublist: Array.from({length:5},(_,i)=>`Song ${i+1}`) },
    { text: 'Share testimony in 3 different venues', sublist: Array.from({length:3},(_,i)=>`Venue ${i+1}`) },
    { text: 'Complete daily random acts of kindness', sublist: Array.from({length:7},(_,i)=>`Day ${i+1}`) },
    { text: 'Fast for a meal and donate savings' },
    { text: 'Get photos with all main speakers', sublist: ['Speaker 1', 'Speaker 2', 'etc.'] },
    { text: 'Visit every exhibitor booth', sublist: Array.from({length:50},(_,i)=>`Booth ${i+1}`) },
    { text: 'Attend all main sessions', sublist: ['Opening', 'Session 1', 'Session 2', 'etc.'] }
];

const BingoTracker = {
    currentMode: 'regular',
    completedTiles: {
        regular: new Set(),
        completionist: new Set()
    },
    subItemProgress: {},
    dailyChallenge: 0,
    sublistKeyHandler: null,

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

            const label = typeof challenge === 'string' ? challenge : challenge.text;
            tile.innerHTML = `<div class="bingo-tile-text">${label}</div>`;
            if (typeof challenge !== 'string' && challenge.sublist) {
                const progress = BingoTracker.subItemProgress[index] ? BingoTracker.subItemProgress[index].length : 0;
                tile.innerHTML += `<div class="bingo-sub-progress">${progress}/${challenge.sublist.length}</div>`;
            }
            tile.addEventListener('click', () => BingoTracker.toggleTile(index));

            grid.appendChild(tile);
        });
    },

    // Toggle tile completion
    toggleTile: (index) => {
        const tile = document.querySelector(`[data-index="${index}"]`);
        if (!tile) return;

        const challenges = BingoTracker.getCurrentChallenges();
        const challenge = challenges[index];

        if (BingoTracker.currentMode === 'completionist' && typeof challenge !== 'string' && challenge.sublist) {
            BingoTracker.openSublist(index);
            return;
        }

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

    // Count total achievements including sub items
    countAchievements: () => {
        if (BingoTracker.currentMode === 'regular') {
            return BingoTracker.completedTiles.regular.size;
        }
        let total = 0;
        COMPLETIONIST_CHALLENGES.forEach((ch, idx) => {
            const progress = BingoTracker.subItemProgress[idx] || [];
            total += progress.length;
            if (BingoTracker.completedTiles.completionist.has(idx)) {
                total += 1;
            }
        });
        return total;
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

    openSublist: (index) => {
        const challenge = COMPLETIONIST_CHALLENGES[index];
        const progress = new Set(BingoTracker.subItemProgress[index] || []);

        const overlay = document.createElement('div');
        overlay.className = 'sublist-overlay';
        overlay.innerHTML = `
            <div class="sublist-content relative">
                <button class="sublist-close" aria-label="Close">&times;</button>
                <h3 class="text-xl font-bold mb-4">${challenge.text}</h3>
                <ul class="sublist-items">
                    ${challenge.sublist.map((item,i)=>`
                        <li>
                            <button class="sub-item-btn ${progress.has(i)?'selected':''}" data-sub="${i}">${item}</button>
                        </li>`).join('')}
                </ul>
            </div>
        `;

        const handleClick = (e) => {
            if (e.target.matches('.sub-item-btn')) {
                const sub = parseInt(e.target.dataset.sub,10);
                if (progress.has(sub)) {
                    progress.delete(sub);
                    e.target.classList.remove('selected');
                } else {
                    progress.add(sub);
                    e.target.classList.add('selected');
                }
                BingoTracker.subItemProgress[index] = [...progress];
                if (progress.size === challenge.sublist.length) {
                    BingoTracker.completedTiles.completionist.add(index);
                } else {
                    BingoTracker.completedTiles.completionist.delete(index);
                }
                BingoTracker.saveProgress();
                BingoTracker.renderGrid();
                BingoTracker.updateStats();
            }
        };

        overlay.addEventListener('click', handleClick);
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('sublist-close') || e.target === overlay) {
                BingoTracker.closeSublist();
            }
        });

        BingoTracker.sublistKeyHandler = (e) => {
            if (e.key === 'Escape') {
                BingoTracker.closeSublist();
            }
        };
        document.addEventListener('keydown', BingoTracker.sublistKeyHandler);

        document.body.appendChild(overlay);
    },

    closeSublist: () => {
        const overlay = document.querySelector('.sublist-overlay');
        if (overlay) overlay.remove();
        if (BingoTracker.sublistKeyHandler) {
            document.removeEventListener('keydown', BingoTracker.sublistKeyHandler);
            BingoTracker.sublistKeyHandler = null;
        }
    },

    // Update statistics
    updateStats: () => {
        const completedCount = BingoTracker.completedTiles[BingoTracker.currentMode].size;
        const totalCount = BingoTracker.getCurrentChallenges().length;
        const progressPercent = Math.round((completedCount / totalCount) * 100);
        const bingoLines = BingoTracker.countBingoLines();
        const achievements = BingoTracker.countAchievements();
        
        const elements = {
            'completed-count': completedCount,
            'progress-percent': progressPercent + '%',
            'bingo-count': bingoLines,
            'achievement-count': achievements
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
        if (BingoTracker.currentMode === 'completionist') {
            Storage.save(Storage.KEYS.BINGO_SUBITEMS_COMPLETIONIST, BingoTracker.subItemProgress);
        }

        const userId = Utils.getUserId();
        const username = document.getElementById('username') ? document.getElementById('username').value || 'Anonymous' : 'Anonymous';
        const completedTiles = [...BingoTracker.completedTiles[BingoTracker.currentMode]];
        fetch('/api/bingo/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, username, completedTiles })
        }).catch(err => {
            console.error('Failed to save progress to server:', err);
        });
    },

    // Load progress
    loadProgress: () => {
        const regular = Storage.load(Storage.KEYS.BINGO_PROGRESS_REGULAR, []);
        const completionist = Storage.load(Storage.KEYS.BINGO_PROGRESS_COMPLETIONIST, []);
        BingoTracker.completedTiles.regular = new Set(regular);
        BingoTracker.completedTiles.completionist = new Set(completionist);
        BingoTracker.subItemProgress = Storage.load(Storage.KEYS.BINGO_SUBITEMS_COMPLETIONIST, {});
    },

    // Reset progress
    reset: () => {
        if (confirm(`Are you sure you want to reset all ${BingoTracker.currentMode} progress?`)) {
            BingoTracker.completedTiles[BingoTracker.currentMode].clear();
            if (BingoTracker.currentMode === 'completionist') {
                BingoTracker.subItemProgress = {};
            }
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
