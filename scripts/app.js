// Main application logic

const App = {
    currentTab: null,
    openTab: (targetId) => {
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabSections = document.querySelectorAll('.tab-section');

        App.currentTab = targetId;

        tabSections.forEach(section => {
            section.classList.toggle('hidden', section.id !== targetId);
        });

        tabLinks.forEach(l => l.classList.remove('active'));
        const targetLink = document.querySelector(`.tab-link[href="#${targetId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        const leaderboardBtn = document.querySelector('.card-type-btn[data-type="leaderboard"]');
        const leaderboardSection = document.getElementById('leaderboard');
        if (leaderboardSection && targetId !== 'bingo') {
            leaderboardSection.classList.add('hidden');
            if (leaderboardBtn) leaderboardBtn.classList.remove('active');
        }

        const nav = document.getElementById('nav');
        if (nav && nav.classList.contains('open')) {
            nav.classList.remove('open');
        }
    },
    // Initialize the application
    init: async () => {
        // Initialize all modules
        App.setupEventListeners();
        if (typeof ServerStatus !== 'undefined' && typeof ServerStatus.init === 'function') {
            ServerStatus.init();
        }
        BingoTracker.init();
        VerseManager.init();
        Leaderboard.init();

        try {
            // Wait for critical initializations to complete
            await Leaderboard.initializationPromise;
            
            // --- NEW: Enforce a minimum display time for the loader ---
            // This ensures the loader is visible for at least a moment, preventing a jarring flash.
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay

            // Remove the loading class to show the app
            document.body.classList.remove('app-loading');
            console.log('✅ Application is ready and displayed.');

        } catch (error) {
            console.error("❌ Critical application initialization failed:", error);
            // Optionally, handle the failure by showing an error message
            // instead of removing the loading screen.
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.innerHTML = '<p style="color: red;">Application failed to load. Please refresh.</p>';
            }
        }
    },

    // Set up event listeners
    setupEventListeners: () => {
        const tabLinks = document.querySelectorAll('.tab-link');
        const activeLink = document.querySelector('.tab-link.active');
        if (activeLink) {
            App.currentTab = activeLink.getAttribute('href').substring(1);
        }

        const menuToggle = document.getElementById('menu-toggle');
        const nav = document.getElementById('nav');

        // Tab navigation
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                App.openTab(targetId);
            });
        });



        // Mobile menu toggle
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }
};

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
