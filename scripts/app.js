// Main application initialization and tab management

const App = {
    currentTab: 'bingo',

    // Initialize the application
    init: () => {
        console.log('Initializing GatherTogether app...');
        
        App.initTabs();
        App.initMenu();
        const inviteBtn = document.getElementById('invite-btn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', App.inviteFriend);
        }
        const inviteBtnMobile = document.getElementById('invite-btn-mobile');
        if (inviteBtnMobile) {
            inviteBtnMobile.addEventListener('click', App.inviteFriend);
        }
        App.initModules();
        App.handleResize();
        
        console.log('App initialized successfully');
    },

    // Initialize tab functionality
    initTabs: () => {
        const links = document.querySelectorAll('.tab-link');
        const sections = document.querySelectorAll('.tab-section');

        links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                App.switchTab(targetId);

                // Hide the navigation menu on mobile after selecting a tab
                const nav = document.getElementById('nav');
                if (nav && (window.innerWidth < 768 || nav.classList.contains('md:hidden'))) {
                    nav.classList.add('hidden');
                    nav.classList.remove('open');
                }
            });
        });

        // Set initial active tab
        App.switchTab(App.currentTab);
    },

    // Initialize mobile menu toggle
    initMenu: () => {
        const toggle = document.getElementById('menu-toggle');
        const nav = document.getElementById('nav');
        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                if (nav.classList.contains('hidden')) {
                    nav.classList.remove('hidden');
                    nav.classList.add('open');
                } else {
                    nav.classList.add('hidden');
                    nav.classList.remove('open');
                }
            });
        }
    },

    // Switch between tabs
    switchTab: (tabId) => {
        const links = document.querySelectorAll('.tab-link');
        const sections = document.querySelectorAll('.tab-section');

        // Update active states
        links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${tabId}`);
        });

        // Show/hide sections
        sections.forEach(section => {
            section.classList.toggle('hidden', section.id !== tabId);
        });

        App.currentTab = tabId;

        // Load tab-specific content if needed
        App.onTabChange(tabId);
    },

    // Handle tab change events
    onTabChange: (tabId) => {
        switch (tabId) {
            case 'bingo':
                // Bingo is initialized on app load
                break;
            case 'verse':
                // Verse is initialized on app load
                break;
            case 'polls':
                // Polls are initialized on app load
                break;
            case 'leaderboard':
                Leaderboard.refresh();
                break;
        }
    },

    // Initialize all modules
    initModules: async () => {
        try {
            // Initialize Leaderboard first to ensure its initialization promise
            // is available for other modules.
            // This call is synchronous and kicks off the async setup work.
            Leaderboard.init();

            // Initialize other modules in parallel.
            await Promise.all([
                BingoTracker.init(),
                VerseManager.init(),
                PollManager.init()
            ]);
        } catch (error) {
            console.error('Error initializing modules:', error);
            Utils.showNotification('Some features may not work properly', 'error');
        }
    },

    // Handle window resize
    handleResize: () => {
        const debouncedResize = Utils.debounce(() => {
            // Handle any resize-specific logic here
            console.log('Window resized');
        }, 250);

        window.addEventListener('resize', debouncedResize);
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
    },

    // Error handling
    handleError: (error) => {
        console.error('App error:', error);
        Utils.showNotification('An error occurred. Please refresh the page.', 'error');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        App.init();
    } catch (error) {
        App.handleError(error);
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    App.handleError(event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    App.handleError(event.reason);
});
