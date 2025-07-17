// Bingo tracker functionality

const BINGO_CHALLENGES = [
    "Take a selfie at the gathering entrance",
    "Learn someone's name from a different state",
    "Attend the opening worship service",
    "Visit 3 different exhibitor booths",
    "Participate in a service project",
    "Do the chicken dance with someone from another group",
    "Memorize the gathering theme verse",
    "Take communion at morning worship",
    "Ask a speaker a question during Q&A",
    "Exchange contact info with 5 new friends",
    "Attend a breakout session on missions",
    "Pray with someone you just met",
    "Try food from the local food trucks",
    "Take a group photo with your youth group",
    "Visit the prayer station and set a reminder to pray daily at home",
    "Share your experience with someone new at home",
    "Attend Mass Event Plus",
    "Write an encouragement note to a hotel worker",
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
    { text: 'Meet people from 5 different countries', sublist: Array.from({length:5},(_,i)=>`Country ${i+1}`), freeText: true },
    { text: 'Collect all district booth prizes', sublist: Array.from({length:10},(_,i)=>`Prize ${i+1}`), freeText: true },
    { text: 'Compete in every convention center game', sublist: Array.from({length:8},(_,i)=>`Game ${i+1}`), freeText: true },
    { text: 'Attend 15+ sessions/workshops', sublist: [], requiredCount: 15, enableSearch: true },
    { text: 'Write thank-you notes to 10 event volunteers', sublist: Array.from({length:10},(_,i)=>`Volunteer ${i+1}`) },
    { text: 'Volunteer for 3+ service opportunities', sublist: Array.from({length:3},(_,i)=>`Service ${i+1}`) },
    { text: 'Get autographs from all guest speakers', sublist: Array.from({length:5},(_,i)=>`Speaker ${i+1}`), freeText: true },
    { text: 'Participate in every worship service', sublist: Array.from({length:5},(_,i)=>`Service ${i+1}`), freeText: true },
    { text: 'Lead a prayer circle with strangers' },
    { text: 'Exchange contacts with 25+ new friends', sublist: Array.from({length:25},(_,i)=>`Friend ${i+1}`), freeText: true },
    { text: 'Complete daily random acts of kindness', sublist: Array.from({length:7},(_,i)=>`Day ${i+1}`), freeText: true },
    { text: 'Fast for a meal and donate savings' },
    { text: 'Get photos with all main speakers', sublist: ['Shelly Schwalm', 'Tanner Olsen', 'Brady Finnern'] },
    { text: 'Visit every exhibitor booth', sublist: Array.from({length:50},(_,i)=>`Booth ${i+1}`) },
    { text: 'Attend all main sessions', sublist: ['Opening', 'Session 1', 'Session 2', 'etc.'], freeText: true }
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
    sessionsLoaded: false,

    // Initialize bingo tracker
    init: async () => {
        await BingoTracker.loadSessions();
        BingoTracker.loadProgress();
        BingoTracker.setDailyChallenge();
        BingoTracker.initCardSelector();
        const startBtn = document.getElementById('start-challenges-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const active = document.querySelector('.card-type-btn[data-type="' + BingoTracker.currentMode + '"]');
                document.querySelectorAll('.card-type-btn').forEach(b => b.classList.remove('active'));
                if (active) active.classList.add('active');
                BingoTracker.hideLeaderboard();
            });
        }
        BingoTracker.renderGrid();
        BingoTracker.updateStats();
    },

    initCardSelector: () => {
        const buttons = document.querySelectorAll('.card-type-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const type = btn.dataset.type;
                if (type === 'leaderboard') {
                    BingoTracker.showLeaderboard();
                } else {
                    BingoTracker.currentMode = type;
                    BingoTracker.hideLeaderboard();
                    App.openTab('bingo');
                    BingoTracker.renderGrid();
                    BingoTracker.updateStats();
                }
            });
        });

        // Ensure leaderboard hidden on init
        BingoTracker.hideLeaderboard();
    },

    showLeaderboard: () => {
        const section = document.getElementById('leaderboard');
        const grid = document.getElementById('bingo-grid');
        const stats = document.querySelector('.stats-container');
        if (section) section.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');
        if (stats) stats.classList.add('hidden');
        App.openTab('bingo');
        App.currentTab = 'leaderboard';
        if (window.Leaderboard && typeof Leaderboard.loadLeaderboard === 'function') {
            Leaderboard.loadLeaderboard();
        }
    },

    hideLeaderboard: () => {
        const section = document.getElementById('leaderboard');
        const grid = document.getElementById('bingo-grid');
        const stats = document.querySelector('.stats-container');
        if (section) section.classList.add('hidden');
        if (grid) grid.classList.remove('hidden');
        if (stats) stats.classList.remove('hidden');
        App.currentTab = 'bingo';
    },

    getCurrentChallenges: () => {
        return BingoTracker.currentMode === 'regular' ? BINGO_CHALLENGES : COMPLETIONIST_CHALLENGES;
    },

    getGridSize: () => {
        return BingoTracker.currentMode === 'regular' ? 5 : 4;
    },

    getProgressCount: (progress) => {
        if (Array.isArray(progress)) return progress.length;
        if (progress && typeof progress === 'object') return Object.keys(progress).length;
        if (progress instanceof Set) return progress.size;
        return 0;
    },

    // Render the bingo grid
    renderGrid: () => {
        const grid = document.getElementById('bingo-grid');
        if (!grid) return;

        grid.innerHTML = ''; // Clear previous tiles

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
                const stored = BingoTracker.subItemProgress[index];
                const progress = BingoTracker.getProgressCount(stored);
                const req = challenge.requiredCount || challenge.sublist.length;
                tile.innerHTML += `<div class="bingo-sub-progress">${progress}/${req}</div>`;
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

        }

        BingoTracker.saveProgress();
        BingoTracker.updateStats();
    },

    // Count total achievements including sub items
    countAchievements: () => {
        if (BingoTracker.currentMode === 'regular') {
            return BingoTracker.completedTiles.regular.size;
        }
        let total = 0;
        COMPLETIONIST_CHALLENGES.forEach((ch, idx) => {
            const progress = BingoTracker.subItemProgress[idx];
            total += BingoTracker.getProgressCount(progress);
            if (BingoTracker.completedTiles.completionist.has(idx)) {
                total += 1;
            }
        });
        return total;
    },

    openSublist: (index) => {
        const challenge = COMPLETIONIST_CHALLENGES[index];
        const stored = BingoTracker.subItemProgress[index];
        const progress = challenge.freeText
            ? (stored || {})
            : new Set(Array.isArray(stored) ? stored : Object.keys(stored || {}));

        const overlay = document.createElement('div');
        overlay.className = 'sublist-overlay';
        const listItems = challenge.sublist.map((item,i)=>{
            if (challenge.freeText) {
                const val = progress[i] || '';
                const selected = val ? 'selected' : '';
                return `<li><input class="sub-item-input ${selected}" data-sub="${i}" placeholder="${item}" value="${val}"></li>`;
            }
            const selected = progress.has(i) ? 'selected' : '';
            return `<li><button class="sub-item-btn ${selected}" data-sub="${i}">${item}</button></li>`;
        }).join('');
        overlay.innerHTML = `
            <div class="sublist-content relative">
                <button class="sublist-close" aria-label="Close">&times;</button>
                <h3 class="text-xl font-bold mb-4">${challenge.text}</h3>
                ${challenge.enableSearch ? '<input type="text" class="sublist-search" placeholder="Search..." />' : ''}
                <ul class="sublist-items">${listItems}</ul>
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
                const req = challenge.requiredCount || challenge.sublist.length;
                if (progress.size >= req) {
                    BingoTracker.completedTiles.completionist.add(index);
                } else {
                    BingoTracker.completedTiles.completionist.delete(index);
                }
                BingoTracker.saveProgress();
                BingoTracker.renderGrid();
                BingoTracker.updateStats();
            }
        };

        const handleInput = (e) => {
            if (e.target.matches('.sub-item-input')) {
                const sub = parseInt(e.target.dataset.sub,10);
                const trimmed = e.target.value.trim();
                if (trimmed === '') {
                    delete progress[sub];
                    e.target.classList.remove('selected');
                } else {
                    progress[sub] = trimmed;
                    e.target.classList.add('selected');
                }
                BingoTracker.subItemProgress[index] = progress;
                const req = challenge.requiredCount || challenge.sublist.length;
                if (Object.keys(progress).length >= req) {
                    BingoTracker.completedTiles.completionist.add(index);
                } else {
                    BingoTracker.completedTiles.completionist.delete(index);
                }
                BingoTracker.saveProgress();
                BingoTracker.renderGrid();
                BingoTracker.updateStats();
            }
        };

        const handleSearch = (e) => {
            if (e.target.matches('.sublist-search')) {
                const term = e.target.value.toLowerCase();
                overlay.querySelectorAll('.sublist-items li').forEach(li => {
                    const text = (li.textContent || li.querySelector('input')?.placeholder || '').toLowerCase();
                    li.style.display = text.includes(term) ? '' : 'none';
                });
            }
        };

        overlay.addEventListener('click', handleClick);
        overlay.addEventListener('input', handleInput);
        overlay.addEventListener('input', handleSearch);
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
        const achievements = BingoTracker.countAchievements();
        
        const elements = {
            'completed-count': completedCount,
            'progress-percent': progressPercent + '%',
            'achievement-count': achievements,
            'total-points': achievements
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

    loadSessions: async () => {
        if (BingoTracker.sessionsLoaded) return;
        try {
            const res = await fetch('data/sessions.json');
            const sessions = await res.json();
            const unique = Array.from(new Set(sessions));
            const challenge = COMPLETIONIST_CHALLENGES.find(c => c.text.startsWith('Attend 15+ sessions'));
            if (challenge) {
                challenge.sublist = unique;
            }
            BingoTracker.sessionsLoaded = true;
        } catch (err) {
            console.error('Failed to load sessions list', err);
        }
    },

    // Save progress
    saveProgress: async () => {
        const key = BingoTracker.currentMode === 'regular'
            ? Storage.KEYS.BINGO_PROGRESS_REGULAR
            : Storage.KEYS.BINGO_PROGRESS_COMPLETIONIST;
        Storage.save(key, [...BingoTracker.completedTiles[BingoTracker.currentMode]]);
        if (BingoTracker.currentMode === 'completionist') {
            Storage.save(Storage.KEYS.BINGO_SUBITEMS_COMPLETIONIST, BingoTracker.subItemProgress);
        }

        const userId = Utils.getUserId();
        const usernameInput = document.getElementById('username');
        const username = usernameInput ? usernameInput.value || 'Anonymous' : 'Anonymous';
        const score = BingoTracker.countAchievements();

        // Always save score so a user can reset their leaderboard entry to zero
        if (window.Leaderboard && typeof Leaderboard.saveScore === 'function') {
            try {
                // Ensure Firebase is ready before attempting to save
                await Leaderboard.initializationPromise;
                await Leaderboard.saveScore(userId, username, score);
                console.log('✅ Progress saved to leaderboard');
            } catch (error) {
                console.warn('Failed to save to leaderboard:', error);
            }
        }

        return true;
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
        const mode = BingoTracker.currentMode === 'completionist' ? 'Hard Mode' : 'Regular';

        const shareText = `I'm ${progressPercent}% done with my ${mode} Faith Challenges at #LCMSGathering2025!`;

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
