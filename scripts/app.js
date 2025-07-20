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

        // navigation menu removed
    },
    // Initialize the application
    init: async () => {
        // Initialize all modules
        App.setupEventListeners();
        BingoTracker.init();
        if (window.HardMode) {
            HardMode.init();
        }
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


        // Tab navigation
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                App.openTab(targetId);
            });
        });

        const inviteBtn = document.getElementById('invite-btn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', App.inviteFriend);
        }

        // Mobile menu removed
    },

    // Share app link via native share or clipboard
    inviteFriend: async () => {
        const inviteText = `Check out this Faith Challenge app for the LCMS Youth Gathering! ${window.location.href}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'GatherTogether Invite',
                    text: inviteText,
                    url: window.location.href
                });
                return;
            } catch (err) {
                console.error('Share failed', err);
                // fall back to copy if share was cancelled or failed
            }
        }
        App.copyInvite(inviteText);
    },

    copyInvite: (text) => {
        const fallbackCopy = (str) => {
            const tempInput = document.createElement('textarea');
            tempInput.value = str;
            tempInput.style.position = 'fixed';
            tempInput.style.top = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.focus();
            tempInput.select();
            try {
                document.execCommand('copy');
                Utils.showNotification('Invite link copied to clipboard!');
            } catch (err) {
                console.error('Fallback copy failed', err);
                Utils.showNotification('Unable to copy invite', 'error');
            }
            document.body.removeChild(tempInput);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => Utils.showNotification('Invite link copied to clipboard!'))
                .catch(err => {
                    console.error('Clipboard copy failed', err);
                    fallbackCopy(text);
                });
        } else {
            fallbackCopy(text);
        }
    }
};

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
