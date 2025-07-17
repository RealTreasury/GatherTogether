// scripts/leaderboard.js

const leaderboard = {
  // DOM elements
  list: document.getElementById('leaderboard-list'),
  playerNameInput: document.getElementById('player-name'),
  setPlayerNameBtn: document.getElementById('set-player-name'),
  currentPlayerDisplay: document.getElementById('current-player'),

  // State
  currentPlayer: null,
  
  /**
   * Initializes the leaderboard functionality
   */
  init() {
    console.log('✅ Leaderboard Initialized');
    this.setPlayerNameBtn.addEventListener('click', () => this.setPlayer());
    this.loadPlayer();
    this.fetchLeaderboard();
    // Refresh leaderboard every 30 seconds
    setInterval(() => this.fetchLeaderboard(), 30000);
  },

  /**
   * Sets the current player name from the input field
   */
  setPlayer() {
    const playerName = this.playerNameInput.value.trim();
    if (playerName) {
      let player = storage.get('player');
      if (!player) {
        player = { id: utils.generateId(), playerName, score: 0 };
      }
      player.playerName = playerName;
      this.currentPlayer = player;
      storage.set('player', player);
      this.updatePlayerDisplay();
      this.playerNameInput.value = '';
    }
  },

  /**
   * Loads the player from local storage
   */
  loadPlayer() {
    const player = storage.get('player');
    if (player) {
      this.currentPlayer = player;
      this.updatePlayerDisplay();
    }
  },

  /**
   * Updates the display showing the current player's name
   */
  updatePlayerDisplay() {
    if (this.currentPlayer) {
      this.currentPlayerDisplay.textContent = `Playing as: ${this.currentPlayer.playerName}`;
    } else {
      this.currentPlayerDisplay.textContent = 'Set your name to join the game!';
    }
  },

  /**
   * Gets the current player object
   * @returns {object | null} The current player object or null
   */
  getCurrentPlayer() {
    return this.currentPlayer;
  },

  /**
   * Records a win for the current player
   * @param {object} player - The player object
   * @param {number} score - The score to add for the win
   */
  recordWin(player, score) {
    if (!player || !player.id) {
      // **THE FIX IS HERE**
      // This alert provides clear feedback to the user.
      alert('Please set your player name before a score can be submitted!');
      console.error('No player found to record win');
      return; // Stop the function
    }
    console.log('🏆 Recording win for', player.playerName);
    const currentScore = player.score || 0;
    const newScore = currentScore + score;
    this.updateScore(player.id, player.playerName, newScore);
  },

  /**
   * Updates a player's score in both local storage and the backend
   * @param {string} id - The player's ID
   * @param {string} playerName - The player's name
   * @param {number} score - The new score
   */
  async updateScore(id, playerName, score) {
    this.currentPlayer.score = score;
    storage.set('player', this.currentPlayer);
    await firebaseLeaderboard.updateScore(id, playerName, score);
    this.fetchLeaderboard(); // Refresh leaderboard after updating
  },

  /**
   * Fetches the leaderboard data from Firebase
   */
  async fetchLeaderboard() {
    try {
      const data = await firebaseLeaderboard.getLeaderboard();
      this.renderLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard from Firebase', error);
    }
  },

  /**
   * Renders the leaderboard data to the UI
   * @param {Array<object>} data - The leaderboard data
   */
  renderLeaderboard(data) {
    this.list.innerHTML = '';
    if (!data || data.length === 0) {
      this.list.innerHTML = '<li class="text-gray-500">No scores yet. Be the first!</li>';
      return;
    }

    data.forEach((player, index) => {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center p-2 rounded-md';
      li.classList.add(index % 2 === 0 ? 'bg-gray-50' : 'bg-white');
      
      const rank = index + 1;
      let medal = '';
      if (rank === 1) medal = '🥇';
      if (rank === 2) medal = '🥈';
      if (rank === 3) medal = '🥉';

      li.innerHTML = `
        <div>
          <span class="font-bold w-6 inline-block">${rank}. ${medal}</span>
          <span>${player.playerName}</span>
        </div>
        <span class="font-bold text-indigo-600">${player.score}</span>
      `;
      this.list.appendChild(li);
    });
  },
};

leaderboard.init();
