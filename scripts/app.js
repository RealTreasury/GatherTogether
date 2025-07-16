import { initBingo3D } from './bingo3d.js';
import { initVerseOfTheHour } from './verseOfTheHour.js';
import { initPolls } from './polls.js';

const links = document.querySelectorAll('.tab-link');
const sections = document.querySelectorAll('.tab-section');

links.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        sections.forEach(sec => {
            sec.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// Initialize modules
document.addEventListener('DOMContentLoaded', () => {
    initBingo3D();
    initVerseOfTheHour();
    initPolls();
});
