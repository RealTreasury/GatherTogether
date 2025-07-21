// Bingo tracker functionality

const BINGO_CHALLENGES = [
    "Take a selfie with a Martin Luther figure or picture",
    "Learn someone's name from a different state",
    "Attend the Saturday mass event",
    "Take a picture with a YAV",
    "Participate in a service project",
    "Do the chicken dance with someone from another group",
    "Memorize the gathering theme verse",
    "Take communion at morning worship",
    "Ask a speaker a question during Q&A",
    "Exchange contact info with 5 new friends (add them on social media)",
    "Complete the Gathering poll",
    "Pray with someone you just met",
    "Sample some classic New Orleans cuisine",
    "Take a group photo with your youth group",
    "Visit the prayer station and set a reminder to pray daily at home",
    "Share your experience with someone new at home",
    "Attend Mass Event Plus",
    "Give Rev. Doug Bender a high five or a hug",
    "Take a picture of someone wearing a sombrero",
    "Take a picture with a comfort dog",
    "Participate in a team game",
    "Share a meal with another youth group",
    "Have an entire conversation with someone in Disney lyrics",
    "Post about the gathering on social media",
    "Give a high-five to 10 different people",
    "Ask someone where the bubbler is",
    "Put a clothespin on someone's bag without them noticing",
    "Get a picture with a Bears fan"
];

const US_STATES = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
    'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

const KINDNESS_IDEAS = [
    'Compliment a stranger',
    'Hold the door for someone',
    'Pick up litter',
    'Donate to a food bank',
    'Help carry someone\'s bags',
    'Write an encouraging note'
];

// Index of the "daily random acts" challenge within COMPLETIONIST_CHALLENGES
// This is used to gate sub items until their release day
let DAILY_KINDNESS_INDEX = 8;
// Index of the "Attend each mass event" challenge for timed release
let MASS_EVENT_INDEX = 9;

const COMPLETIONIST_CHALLENGES = [
    { text: 'Meet someone from all 50 states', sublist: US_STATES },
    { text: 'Meet people from 5 different countries', sublist: Array.from({length:5},(_,i)=>`Country ${i+1}`), freeText: true },
    { text: 'Take a picture with someone with each hair color',
      sublist: ['Brown', 'Blonde', 'Black', 'Red', 'Pink', 'Green', 'Orange', 'Bald'] },
    { text: 'Fast for a meal and donate savings' },
    { text: 'Lead a prayer circle with strangers' },
    { text: 'Write thank-you notes to 10 event volunteers',
        sublist: [
            'Hotel worker',
            'Group Leader',
            'Adult Volunteer',
            'YAV',
            'Police Officer',
            'Restaurant worker',
            'Stadium worker',
            'Bus driver / Airline worker',
            'Janitor',
            'Pastor'
        ] },
    { text: 'Volunteer for 3+ service opportunities', sublist: Array.from({length:3},(_,i)=>`Service ${i+1}`) },
    { text: 'Exchange contact info with 25+ new friends (add them on social media)', sublist: Array.from({length:25},(_,i)=>`Friend ${i+1}`), freeText: true },
    { text: 'Complete daily random acts of kindness', sublist: Array.from({length:7},(_,i)=>`Day ${i+1}`), freeText: true },
    { text: 'Attend each mass event',
      sublist: [
        'Saturday',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday Worship'
      ],
      freeText: false },
    { text: 'Attend 15+ sessions/workshops', sublist: [], requiredCount: 15, enableSearch: true },
    { text: 'Complete the photo challenges for each day', sublist: Array.from({length:5},(_,i)=>`Day ${i+1}`), freeText: true },
    { text: 'Get photos with all main speakers', sublist: ['Shelly Schwalm', 'Tanner Olsen', 'Brady Finnern'] },
    { text: 'Compete in every convention center game',
      sublist: [
        'Volleyball',
        'Basketball',
        '9-square',
        'Ladder golf',
        'Gagaball',
        'Giant jenga',
        'Pickleball',
        'Ping pong',
        'Ultimate frisbee',
        'Hungry hungry hippos',
        'Twister',
        'Giant Uno'
      ] },
    { text: 'Collect all district booth prizes', sublist: [
        'Atlantic District',
        'California-Nevada-Hawaii District',
        'Central Illinois District',
        'Eastern District',
        'Florida-Georgia District',
        'Indiana District',
        'Iowa District East',
        'Iowa District West',
        'Kansas District',
        'Michigan District',
        'Mid-South District',
        'Minnesota North District',
        'Minnesota South District',
        'Missouri District',
        'Montana District',
        'Nebraska District',
        'New England District',
        'New Jersey District',
        'North Dakota District',
        'North Wisconsin District',
        'Northern Illinois District',
        'Northwest District',
        'Ohio District',
        'Oklahoma District',
        'Pacific Southwest District',
        'Rocky Mountain District',
        'South Dakota District',
        'South Wisconsin District',
        'Southeastern District',
        'Southern District',
        'Southern Illinois District',
        'Texas District',
        'Wyoming District',
        'English District',
        'SELC District'
    ] },
    { text: 'Visit every exhibitor booth', sublist: [
        'Saint Paul Lutheran High School',
        'Shepherd\'s Heart Ministry',
        'Three Trees Outdoor Ministry',
        'Y4Life, Lutherans For Life',
        'National Lutheran Outdoors Ministry Association',
        'Ongoing Ambassadors For Christ',
        'Orphan Grain Train',
        'Our Place After School Care Inc.',
        'Lutheran Hour Ministries',
        'Lutheran Legal League',
        'Lutheran Women in Mission',
        'National Association of Directors of Christian Education',
        'Lutheran Center for Religious Liberty',
        'Lutheran Church Extension Fund (LCEF)',
        'The Lutheran Church—Missouri Synod',
        'Lutheran Counseling and Family Services of WI',
        'Ysleta Lutheran Mission Human Care',
        'KINDLE',
        'LAMP Ministry Inc.',
        'Lutheran Bible Translators',
        'Lutheran Braille Workers',
        'Forged by Fire Services',
        'Higher Things',
        'International Student Ministry, Inc.',
        'KFUO Radio',
        'Concordia University Nebraska',
        'Concordia University System',
        'Concordia University Wisconsin and Ann Arbor',
        'Concordia University, St. Paul',
        'A Place of Refuge Ministries of South WI Inc.',
        'Camp Restore Detroit',
        'Concordia Plans',
        'Concordia Publishing House',
        'Concordia Seminary',
        'Concordia Theological Seminary',
        'Concordia University Chicago',
        'Concordia University Irvine'
    ] },
];

const BingoTracker = {
    currentMode: 'regular',
    completedTiles: {
        regular: new Set(),
        completionist: new Set()
    },
    subItemProgress: {},
    sublistKeyHandler: null,
    sessionsLoaded: false,

    // Initialize bingo tracker
    init: async () => {
        await BingoTracker.loadSessions();
        BingoTracker.loadProgress();
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
                    BingoTracker.renderGrid();
                    BingoTracker.updateStats();
                }
            });
        });

        // Handle initially active button
        const activeBtn = document.querySelector('.card-type-btn.active');
        if (activeBtn && activeBtn.dataset.type === 'leaderboard') {
            BingoTracker.showLeaderboard();
        } else {
            if (activeBtn) BingoTracker.currentMode = activeBtn.dataset.type;
            BingoTracker.hideLeaderboard();
        }
    },

    showLeaderboard: () => {
        // Hide ALL challenge content (both regular and hard mode)
        const grid = document.getElementById('bingo-grid');
        const stats = document.querySelector('.stats-container');
        const resetButtons = document.querySelector('.text-center.mt-6');

        if (grid) grid.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (resetButtons) resetButtons.style.display = 'none';

        // Show leaderboard section
        const section = document.getElementById('leaderboard');
        if (section) section.style.display = 'block';

        // Load leaderboard data
        if (window.Leaderboard && typeof Leaderboard.loadLeaderboard === 'function') {
            Leaderboard.loadLeaderboard();
        }
    },

    hideLeaderboard: () => {
        // Hide leaderboard section
        const section = document.getElementById('leaderboard');
        if (section) section.style.display = 'none';

        // Show challenge content
        const grid = document.getElementById('bingo-grid');
        const stats = document.querySelector('.stats-container');
        const resetButtons = document.querySelector('.text-center.mt-6');

        if (grid) grid.style.display = 'grid';
        if (stats) stats.style.display = 'grid';
        if (resetButtons) resetButtons.style.display = 'flex';
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
    // Optionally provide a mode ('regular' or 'completionist') to override
    countAchievements: (mode = BingoTracker.currentMode) => {
        if (mode === 'regular') {
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

    // Calculate total points across both modes
    getTotalPoints: () => {
        const regular = BingoTracker.countAchievements('regular');
        const completionist = BingoTracker.countAchievements('completionist');
        return regular + completionist;
    },

    // Calculate maximum possible points across both modes
    getTotalPossiblePoints: () => {
        let total = BINGO_CHALLENGES.length;
        COMPLETIONIST_CHALLENGES.forEach(ch => {
            const req = ch.requiredCount || (ch.sublist ? ch.sublist.length : 0);
            total += req + 1;
        });
        return total;
    },

    // Overall completion percentage including sub items
    getTotalProgressPercent: () => {
        const achieved = BingoTracker.getTotalPoints();
        const possible = BingoTracker.getTotalPossiblePoints();
        return possible ? Math.round((achieved / possible) * 100) : 0;
    },

    openSublist: (index) => {
        const challenge = COMPLETIONIST_CHALLENGES[index];
        const stored = BingoTracker.subItemProgress[index];
        const progress = challenge.freeText
            ? (stored || {})
            : new Set(Array.isArray(stored) ? stored : Object.keys(stored || {}));

        const overlay = document.createElement('div');
        overlay.className = 'sublist-overlay';
        const dayOfEvent = window.AntiCheatSystem ?
            window.AntiCheatSystem.eventConfig.getDayOfEvent() : 8;

        const isKindness = index === DAILY_KINDNESS_INDEX;
        const isMassEvent = index === MASS_EVENT_INDEX;
        const centralNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
        const getMassUnlockTime = (offset) => {
            const base = window.AntiCheatSystem ? new Date(window.AntiCheatSystem.eventConfig.startDate) : new Date();
            base.setDate(base.getDate() + offset);
            const central = new Date(base.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
            central.setHours(19, 30, 0, 0); // 7:30 PM Central
            return central;
        };
        const listItems = challenge.sublist.map((item, i) => {
            let unlocked = true;
            if (isKindness) {
                unlocked = dayOfEvent > i;
            } else if (isMassEvent) {
                unlocked = i === 0 || centralNow >= getMassUnlockTime(i);
            }
            if (challenge.freeText) {
                const val = progress[i] || '';
                const selected = val ? 'selected' : '';
                const disabled = unlocked ? '' : 'disabled';
                const datalist = isKindness ? 'list="kindness-options"' : '';
                return `<li><input ${datalist} class="sub-item-input ${selected}" data-sub="${i}" placeholder="${item}" value="${val}" ${disabled}></li>`;
            }
            const selected = progress.has(i) ? 'selected' : '';
            const disabled = unlocked ? '' : 'disabled';
            return `<li><button class="sub-item-btn ${selected}" data-sub="${i}" ${disabled}>${item}</button></li>`;
        }).join('');
        overlay.innerHTML = `
            <div class="sublist-content relative">
                <button class="sublist-close" aria-label="Close">&times;</button>
                <h3 class="text-xl font-bold mb-4">${challenge.text}</h3>
                ${challenge.enableSearch ? '<input type="text" class="sublist-search" placeholder="Search..." />' : ''}
                <ul class="sublist-items">${listItems}</ul>
                ${isKindness ? `<datalist id="kindness-options">${KINDNESS_IDEAS.map(k => `<option value="${k}"></option>`).join('')}</datalist>` : ''}
            </div>
        `;

        const handleClick = (e) => {
            if (e.target.matches('.sub-item-btn')) {
                const sub = parseInt(e.target.dataset.sub,10);
                if (isKindness && dayOfEvent <= sub) {
                    if (window.Utils && Utils.showNotification) {
                        Utils.showNotification(`Come back on Day ${sub+1} to complete this act!`, 'warning');
                    }
                    return;
                }
                const nowCentral = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
                if (isMassEvent && sub > 0 && nowCentral < getMassUnlockTime(sub)) {
                    if (window.Utils && Utils.showNotification) {
                        Utils.showNotification('This mass event unlocks at 7:30 PM CT.', 'warning');
                    }
                    return;
                }
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
                if (isKindness && dayOfEvent <= sub) {
                    if (window.Utils && Utils.showNotification) {
                        Utils.showNotification(`Come back on Day ${sub+1} to complete this act!`, 'warning');
                    }
                    e.target.value = progress[sub] || '';
                    return;
                }
                const nowCentral = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
                if (isMassEvent && sub > 0 && nowCentral < getMassUnlockTime(sub)) {
                    if (window.Utils && Utils.showNotification) {
                        Utils.showNotification('This mass event unlocks at 7:30 PM CT.', 'warning');
                    }
                    e.target.value = progress[sub] || '';
                    return;
                }
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
        const totalPoints = BingoTracker.getTotalPoints();
        const totalProgress = BingoTracker.getTotalProgressPercent();

        const elements = {
            'completed-count': completedCount,
            'progress-percent': progressPercent + '%',
            'achievement-count': achievements,
            'total-points': totalPoints,
            'total-progress': totalProgress + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
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
        const score = BingoTracker.getTotalPoints();

        // Always save score so a user can reset their leaderboard entry to zero
        if (window.Leaderboard && typeof Leaderboard.saveScore === 'function') {
            try {
                // Ensure Firebase is ready before attempting to save
                await Leaderboard.initializationPromise;
                await Leaderboard.saveScore(userId, username, score);
                console.log('Progress saved to leaderboard');
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
        const mode = BingoTracker.currentMode === 'completionist' ? 'Hard Mode' : 'Easy Mode';

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

// Export for use in other modules and make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BingoTracker;
}

if (typeof window !== 'undefined') {
    window.BingoTracker = BingoTracker;
}
