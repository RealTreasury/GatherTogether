const CHALLENGES = [
    "Share your faith story", "Pray for a friend", "Read John 3:16", "Help a stranger", "Attend worship",
    "Join a Bible study", "Thank a volunteer", "Make a new friend", "Sing a hymn", "Share a meal",
    "Give encouragement", "Practice forgiveness", "Show kindness", "Learn a verse", "Serve others",
    "Share testimony", "Invite someone", "Practice gratitude", "Listen deeply", "Show compassion",
    "Spread joy", "Be patient", "Offer help", "Share hope", "Love neighbor"
];

let completedTiles = new Set();

export function initBingo() {
    const container = document.getElementById('bingo-container');
    if (!container) return;
    container.innerHTML = '';

    loadGameState();

    const grid = document.createElement('div');
    grid.className = 'bingo-grid';

    CHALLENGES.forEach((challenge, index) => {
        const tile = document.createElement('div');
        tile.className = 'bingo-tile';
        tile.textContent = challenge;
        if (completedTiles.has(index)) tile.classList.add('completed');
        tile.addEventListener('click', () => toggleTile(index, tile));
        grid.appendChild(tile);
    });

    container.appendChild(grid);
    checkBingo();
}

window.initBingo = initBingo;

function toggleTile(index, tile) {
    if (completedTiles.has(index)) {
        completedTiles.delete(index);
        tile.classList.remove('completed');
    } else {
        completedTiles.add(index);
        tile.classList.add('completed');
    }
    saveGameState();
    checkBingo();
}

function checkBingo() {
    const size = 5;
    const board = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => completedTiles.has(r * size + c))
    );

    const winRow = board.some(row => row.every(Boolean));
    const winCol = board[0].some((_, c) => board.every(row => row[c]));
    const winDiag1 = board.every((row, i) => row[i]);
    const winDiag2 = board.every((row, i) => row[size - i - 1]);

    if (winRow || winCol || winDiag1 || winDiag2) {
        showBingoMessage();
    }
}

function showBingoMessage() {
    if (document.getElementById('bingo-message')) return;
    const msg = document.createElement('div');
    msg.id = 'bingo-message';
    msg.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded shadow';
    msg.textContent = 'BINGO!';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function saveGameState() {
    if (window.storage) {
        window.storage.saveState('bingoCompleted', [...completedTiles]);
    }
}

function loadGameState() {
    if (window.storage) {
        const saved = window.storage.loadState('bingoCompleted', []);
        completedTiles = new Set(saved);
    }
}
