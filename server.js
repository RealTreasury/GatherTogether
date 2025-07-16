const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'polls.json');
const RESPONSES_DATA_PATH = path.join(__dirname, 'data', 'poll_responses.json');
const BINGO_PROGRESS_PATH = path.join(__dirname, 'data', 'bingo_progress.json');

const SAMPLE_POLLS = [
  {
    id: 'youth-gathering-excitement',
    question: 'How excited are you for the Youth Gathering?',
    options: [
      { id: 'very-excited', text: 'Very excited! 🎉', votes: 0 },
      { id: 'excited', text: 'Excited 😊', votes: 0 },
      { id: 'somewhat', text: 'Somewhat excited 😐', votes: 0 },
      { id: 'not-sure', text: 'Not sure yet 🤔', votes: 0 }
    ],
    allowMultiple: false,
    active: true
  },
  {
    id: 'favorite-activity',
    question: 'What are you most looking forward to?',
    options: [
      { id: 'worship', text: 'Worship services 🙏', votes: 0 },
      { id: 'sessions', text: 'Learning sessions 📚', votes: 0 },
      { id: 'friends', text: 'Meeting new friends 👥', votes: 0 },
      { id: 'service', text: 'Service opportunities 🤝', votes: 0 },
      { id: 'activities', text: 'Fun activities 🎮', votes: 0 }
    ],
    allowMultiple: true,
    active: true
  }
];

function loadPolls() {
  if (fs.existsSync(DATA_PATH)) {
    try {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading polls file:', err);
    }
  }
  savePolls(SAMPLE_POLLS);
  return JSON.parse(JSON.stringify(SAMPLE_POLLS));
}

function savePolls(polls) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(polls, null, 2));
}

function loadPollResponses() {
  if (fs.existsSync(RESPONSES_DATA_PATH)) {
    try {
      const data = fs.readFileSync(RESPONSES_DATA_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading poll responses file:', err);
    }
  }
  return [];
}

function savePollResponses(responses) {
  fs.mkdirSync(path.dirname(RESPONSES_DATA_PATH), { recursive: true });
  fs.writeFileSync(RESPONSES_DATA_PATH, JSON.stringify(responses, null, 2));
}

function loadBingoProgress() {
  if (fs.existsSync(BINGO_PROGRESS_PATH)) {
    try {
      const data = fs.readFileSync(BINGO_PROGRESS_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading bingo progress file:', err);
    }
  }
  return [];
}

function saveBingoProgress(progress) {
  fs.mkdirSync(path.dirname(BINGO_PROGRESS_PATH), { recursive: true });
  fs.writeFileSync(BINGO_PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

let polls = loadPolls();
let pollResponses = loadPollResponses();
let bingoProgress = loadBingoProgress();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/polls', (req, res) => {
  const pollsWithVotes = polls.map(poll => {
    const updatedOptions = poll.options.map(option => {
      const votes = pollResponses.filter(r => r.pollId === poll.id && r.optionId === option.id).length;
      return { ...option, votes };
    });
    return { ...poll, options: updatedOptions };
  });
  res.json(pollsWithVotes);
});

app.post('/api/polls/:pollId/vote', (req, res) => {
  const { pollId } = req.params;
  const { optionId, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const poll = polls.find(p => p.id === pollId);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  const option = poll.options.find(o => o.id === optionId);
  if (!option) return res.status(400).json({ error: 'Option not found' });

  const newResponse = {
    userId,
    pollId,
    optionId,
    timestamp: new Date().toISOString()
  };
  pollResponses.push(newResponse);
  savePollResponses(pollResponses);

  res.status(201).json({ message: 'Vote recorded' });
});

app.post('/api/bingo/progress', (req, res) => {
  const { userId, username, completedTiles } = req.body;
  if (!userId || !username) {
    return res.status(400).json({ error: 'User ID and username are required' });
  }

  let userProgress = bingoProgress.find(p => p.userId === userId);
  if (userProgress) {
    userProgress.completedTiles = completedTiles;
    userProgress.username = username;
  } else {
    bingoProgress.push({ userId, username, completedTiles });
  }

  saveBingoProgress(bingoProgress);
  res.status(200).json({ message: 'Progress saved' });
});

app.get('/api/bingo/leaderboard', (req, res) => {
  const leaderboard = bingoProgress
    .map(p => ({ username: p.username, score: p.completedTiles.length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(leaderboard);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
