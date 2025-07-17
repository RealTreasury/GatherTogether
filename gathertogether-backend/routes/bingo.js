const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboardSnapshot = await db
      .collection('bingo_leaderboard')
      .orderBy('score', 'desc')
      .limit(50)
      .get();

    const leaderboard = [];
    leaderboardSnapshot.forEach(doc => {
      leaderboard.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Update player score
router.post('/leaderboard', async (req, res) => {
  try {
    const { playerId, playerName, score } = req.body;

    const playerRef = db.collection('bingo_leaderboard').doc(playerId);

    await playerRef.set(
      {
        playerName,
        score,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ message: 'Score updated successfully' });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Get bingo games
router.get('/games', async (req, res) => {
  try {
    const gamesSnapshot = await db.collection('bingo_games').get();
    const games = [];

    gamesSnapshot.forEach(doc => {
      games.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(games);
  } catch (error) {
    console.error('Error fetching bingo games:', error);
    res.status(500).json({ error: 'Failed to fetch bingo games' });
  }
});

module.exports = router;
