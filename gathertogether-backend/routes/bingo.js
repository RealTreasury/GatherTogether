const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { getSheetsClient, spreadsheetId } = require('../config/googleSheets');

const useSheets = !!process.env.GOOGLE_SHEETS_ID;

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    if (useSheets) {
      const sheets = await getSheetsClient();
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Leaderboard!A2:C',
      });
      const rows = result.data.values || [];
      const leaderboard = rows
        .map(r => ({ id: r[0], playerName: r[1], score: parseInt(r[2], 10) || 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
      return res.json(leaderboard);
    }

    const leaderboardSnapshot = await db
      .collection('leaderboard') // <-- CHANGED
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
    if (useSheets) {
      const sheets = await getSheetsClient();
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Leaderboard!A2:C',
      });
      const rows = result.data.values || [];
      let rowIndex = rows.findIndex(r => r[0] === playerId);
      if (rowIndex === -1) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Leaderboard!A2:C',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: { values: [[playerId, playerName, score]] },
        });
      } else {
        rowIndex += 2;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Leaderboard!A${rowIndex}:C${rowIndex}`,
          valueInputOption: 'RAW',
          resource: { values: [[playerId, playerName, score]] },
        });
      }
      return res.json({ message: 'Score updated successfully' });
    }

    const playerRef = db.collection('leaderboard').doc(playerId); // <-- CHANGED

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
