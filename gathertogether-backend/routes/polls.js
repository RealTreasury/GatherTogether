const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Get all polls
router.get('/', async (req, res) => {
  try {
    const pollsSnapshot = await db.collection('polls').get();
    const polls = [];

    pollsSnapshot.forEach(doc => {
      polls.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Create new poll
router.post('/', async (req, res) => {
  try {
    const pollData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('polls').add(pollData);

    res.status(201).json({
      id: docRef.id,
      message: 'Poll created successfully',
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Update poll
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('polls').doc(id).update(updateData);

    res.json({ message: 'Poll updated successfully' });
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({ error: 'Failed to update poll' });
  }
});

// Delete poll
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('polls').doc(id).delete();

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
});

module.exports = router;
