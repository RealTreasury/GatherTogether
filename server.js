const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const UsernameValidator = require('./scripts/username-validator');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_PATH = path.join(DATA_DIR, 'polls.json');
const RESPONSES_DATA_PATH = path.join(DATA_DIR, 'poll_responses.json');
const BINGO_PROGRESS_PATH = path.join(DATA_DIR, 'bingo_progress.json');
const USERS_DATA_PATH = path.join(DATA_DIR, 'users.json');

function countBingoLines(completedTiles, size = 5) {
  const completedSet = new Set(completedTiles || []);
  let count = 0;

  for (let row = 0; row < size; row++) {
    let complete = true;
    for (let col = 0; col < size; col++) {
      if (!completedSet.has(row * size + col)) {
        complete = false;
        break;
      }
    }
    if (complete) count++;
  }

  for (let col = 0; col < size; col++) {
    let complete = true;
    for (let row = 0; row < size; row++) {
      if (!completedSet.has(row * size + col)) {
        complete = false;
        break;
      }
    }
    if (complete) count++;
  }

  let diagonal1 = true,
    diagonal2 = true;
  for (let i = 0; i < size; i++) {
    if (!completedSet.has(i * size + i)) diagonal1 = false;
    if (!completedSet.has(i * size + (size - 1 - i))) diagonal2 = false;
  }
  if (diagonal1) count++;
  if (diagonal2) count++;

  return count;
}

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

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPolls() {
  ensureDataDir();
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
  ensureDataDir();
  fs.writeFileSync(DATA_PATH, JSON.stringify(polls, null, 2));
}

function loadPollResponses() {
  ensureDataDir();
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
  ensureDataDir();
  fs.writeFileSync(RESPONSES_DATA_PATH, JSON.stringify(responses, null, 2));
}

function loadBingoProgress() {
  ensureDataDir();
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
  ensureDataDir();
  fs.writeFileSync(BINGO_PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadUsers() {
  ensureDataDir();
  if (fs.existsSync(USERS_DATA_PATH)) {
    try {
      const data = fs.readFileSync(USERS_DATA_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading users file:', err);
    }
  }
  return [];
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_DATA_PATH, JSON.stringify(users, null, 2));
}

let polls = loadPolls();
let pollResponses = loadPollResponses();
let bingoProgress = loadBingoProgress();
let users = loadUsers();

// Validate username to match client-side rules
function validateUsername(username) {
  const DEFAULT_NAME = 'Anonymous';

  if (typeof username !== 'string') {
    return { cleanUsername: DEFAULT_NAME, isClean: false };
  }

  let cleaned = username.trim();
  cleaned = cleaned.replace(/[^a-zA-Z0-9 _-]/g, '');
  const MAX_LENGTH = 20;
  if (cleaned.length > MAX_LENGTH) cleaned = cleaned.substring(0, MAX_LENGTH);
  if (!cleaned) cleaned = DEFAULT_NAME;

  const flagged = UsernameValidator.isInappropriate(cleaned);
  const finalClean = UsernameValidator.getCleanUsername(cleaned);

  const isClean = !flagged && finalClean === username;
  return { cleanUsername: finalClean, isClean };
}

function getPollsWithVotes() {
  return polls.map(poll => {
    const updatedOptions = poll.options.map(option => {
      const votes = pollResponses.filter(r => r.pollId === poll.id && r.optionId === option.id).length;
      return { ...option, votes };
    });
    return { ...poll, options: updatedOptions };
  });
}

function getLeaderboard() {
  const leaderboard = bingoProgress
    .map(p => ({ 
      id: p.userId,
      playerName: p.username, 
      score: p.completedTiles ? p.completedTiles.length : 0,
      updatedAt: p.updatedAt || new Date().toISOString()
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100); // Top 100 players
  
  console.log('Current leaderboard:', leaderboard);
  return leaderboard;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Socket.IO connection handling
io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  socket.emit('pollsUpdate', getPollsWithVotes());
  socket.emit('leaderboardUpdate', getLeaderboard());
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'GatherTogether Node.js Backend'
  });
});

// Polls endpoints
app.get('/api/polls', (req, res) => {
  console.log('GET /api/polls requested');
  res.json(getPollsWithVotes());
});

app.post('/api/polls/:pollId/vote', (req, res) => {
  const { pollId } = req.params;
  const { optionId, userId } = req.body;
  
  console.log('Vote received:', { pollId, optionId, userId });

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

  // Emit update to all connected clients
  io.emit('pollsUpdate', getPollsWithVotes());

  res.status(201).json({ message: 'Vote recorded' });
});

// Bingo endpoints
app.post('/api/bingo/progress', (req, res) => {
  const { userId, username, completedTiles } = req.body;
  console.log('Bingo progress update:', { userId, username, completedTiles });

  if (!userId || !username) {
    return res.status(400).json({ error: 'User ID and username are required' });
  }

  const { cleanUsername, isClean } = validateUsername(username);

  let userProgress = bingoProgress.find(p => p.userId === userId);
  if (userProgress) {
    userProgress.completedTiles = completedTiles || [];
    userProgress.username = cleanUsername;
    userProgress.updatedAt = new Date().toISOString();
  } else {
    bingoProgress.push({
      userId,
      username: cleanUsername,
      completedTiles: completedTiles || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveBingoProgress(bingoProgress);
  
  const leaderboard = getLeaderboard();
  io.emit('leaderboardUpdate', leaderboard);
  
  res.status(200).json({ message: 'Progress saved', cleaned: !isClean });
});

app.get('/api/bingo/leaderboard', (req, res) => {
  console.log('GET /api/bingo/leaderboard requested');
  const leaderboard = getLeaderboard();
  res.json(leaderboard);
});

// New endpoint for updating leaderboard scores (matches frontend expectations)
app.post('/api/bingo/leaderboard', (req, res) => {
  const { playerId, playerName, score } = req.body;
  console.log('Leaderboard score update:', { playerId, playerName, score });

  if (!playerId || !playerName || score === undefined) {
    return res.status(400).json({ error: 'Player ID, player name, and score are required' });
  }

  const { cleanUsername, isClean } = validateUsername(playerName);

  let userProgress = bingoProgress.find(p => p.userId === playerId);
  if (userProgress) {
    userProgress.username = cleanUsername;
    userProgress.score = score;
    userProgress.updatedAt = new Date().toISOString();
    // Update completedTiles to match score if needed
    if (!userProgress.completedTiles || userProgress.completedTiles.length !== score) {
      userProgress.completedTiles = Array.from({length: score}, (_, i) => i);
    }
  } else {
    bingoProgress.push({
      userId: playerId,
      username: cleanUsername,
      score: score,
      completedTiles: Array.from({length: score}, (_, i) => i),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveBingoProgress(bingoProgress);
  
  const leaderboard = getLeaderboard();
  io.emit('leaderboardUpdate', leaderboard);
  
  res.json({ message: 'Score updated successfully', cleaned: !isClean });
});

app.get('/api/bingo/lines/:userId', (req, res) => {
  const { userId } = req.params;
  const userProgress = bingoProgress.find(p => p.userId === userId);
  if (!userProgress) {
    return res.status(404).json({ error: 'User not found' });
  }

  const lines = countBingoLines(userProgress.completedTiles);
  res.json({ userId, lines });
});

// User info endpoints
app.post('/api/users', (req, res) => {
  const { userId, username, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const usernameProvided = typeof username !== 'undefined';
  const { cleanUsername, isClean } = validateUsername(usernameProvided ? username : undefined);

  let user = users.find(u => u.userId === userId);
  if (user) {
    if (usernameProvided) {
      user.username = cleanUsername;
    }
    user.email = email || user.email;
    user.updatedAt = new Date().toISOString();
  } else {
    user = { userId, username: cleanUsername || '', email: email || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    users.push(user);
  }

  saveUsers(users);
  res.status(200).json({ message: 'User info saved', cleaned: usernameProvided ? !isClean : false });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.userId === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;

  if (
    keyPath &&
    certPath &&
    fs.existsSync(keyPath) &&
    fs.existsSync(certPath)
  ) {
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    const httpsServer = https.createServer({ key, cert }, app);
    io.attach(httpsServer);
    httpsServer.listen(PORT, () => {
      console.log(`🚀 HTTPS Server running on https://localhost:${PORT}`);
      console.log(`📊 API available at https://localhost:${PORT}/api`);
    });
  } else {
    server.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`🎮 Bingo Leaderboard: http://localhost:${PORT}/api/bingo/leaderboard`);
    });
  }
}

module.exports = app;
