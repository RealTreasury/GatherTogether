const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'polls.json');

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

let polls = loadPolls();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/polls', (req, res) => {
  res.json(polls);
});

app.post('/api/polls/:pollId/vote', (req, res) => {
  const { pollId } = req.params;
  const { optionId } = req.body;
  const poll = polls.find(p => p.id === pollId);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  const option = poll.options.find(o => o.id === optionId);
  if (!option) return res.status(400).json({ error: 'Option not found' });

  option.votes = (option.votes || 0) + 1;
  savePolls(polls);
  res.json(poll);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
