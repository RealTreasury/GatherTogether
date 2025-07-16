import { initBingo3D } from './bingo3d.js';
import { initVerseOfTheHour } from './verseOfTheHour.js';
import { initPolls } from './polls.js';

// Tab switching functionality
function initTabs() {
    const links = document.querySelectorAll('.tab-link');
    const sections = document.querySelectorAll('.tab-section');

    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Remove active class from all links
            links.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all sections
            sections.forEach(sec => {
                sec.classList.add('hidden');
            });
            
            // Show target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });
    
    // Set initial active tab
    const firstLink = links[0];
    if (firstLink) {
        firstLink.classList.add('active');
    }
}

// Initialize modules
async function initializeApp() {
    try {
        console.log('Initializing GatherTogether app...');
        
        // Initialize tabs first
        initTabs();
        
        // Initialize modules
        await initBingo3D();
        initVerseOfTheHour();
        initPolls();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
