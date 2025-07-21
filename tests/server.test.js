const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');

let app;
let tempDir;

beforeEach(() => {
  jest.resetModules();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gathertest-'));
  process.env.DATA_DIR = tempDir;
  app = require('../server');
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env.DATA_DIR;
  jest.resetModules();
});

test('GET /api/polls returns poll data', async () => {
  const res = await request(app).get('/api/polls');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

test('POST /api/polls/:pollId/vote stores a vote and returns success', async () => {
  const pollsRes = await request(app).get('/api/polls');
  const pollId = pollsRes.body[0].id;
  const optionId = pollsRes.body[0].options[0].id;

  const res = await request(app)
    .post(`/api/polls/${pollId}/vote`)
    .send({ optionId, userId: 'user123' });

  expect(res.status).toBe(201);
  expect(res.body.message).toBe('Vote recorded');

  const respPath = path.join(tempDir, 'poll_responses.json');
  expect(fs.existsSync(respPath)).toBe(true);
  const responses = JSON.parse(fs.readFileSync(respPath, 'utf8'));
  expect(responses.length).toBe(1);
  expect(responses[0].pollId).toBe(pollId);
});

test('Bingo progress endpoints record progress and return leaderboard data', async () => {
  const progress = { userId: 'u1', username: 'Alice', completedTiles: [1, 2, 3] };
  const progressRes = await request(app)
    .post('/api/bingo/progress')
    .send(progress);

  expect(progressRes.status).toBe(200);
  expect(progressRes.body.message).toBe('Progress saved');

  const leaderboardRes = await request(app).get('/api/bingo/leaderboard');
  expect(leaderboardRes.status).toBe(200);
  expect(Array.isArray(leaderboardRes.body)).toBe(true);
  expect(leaderboardRes.body[0].playerName).toBe(progress.username);
  expect(leaderboardRes.body[0].score).toBe(progress.completedTiles.length);
});

test('Leaderboard ranks users and updates existing entries', async () => {
  // create two users with different scores
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'u1', username: 'User1', completedTiles: [1] });
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'u2', username: 'User2', completedTiles: [1, 2, 3] });

  // update first user with higher score
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'u1', username: 'User1', completedTiles: [1, 2, 3, 4, 5] });

  const res = await request(app).get('/api/bingo/leaderboard');
  expect(res.status).toBe(200);
  expect(res.body.length).toBe(2);
  const user1 = res.body.find(e => e.id === 'u1');
  const user2 = res.body.find(e => e.id === 'u2');
  expect(user1).toBeTruthy();
  expect(user2).toBeTruthy();
  expect(user1.score).toBe(5);
  expect(user2.score).toBe(3);
  expect(user1.playerName.toLowerCase()).not.toContain('user');
  expect(user2.playerName.toLowerCase()).not.toContain('user');
});

test('Leaderboard includes rank change within 24 hours', async () => {
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'r1', username: 'One', completedTiles: [1] });
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'r2', username: 'Two', completedTiles: [1, 2] });

  // initial leaderboard to populate history
  await request(app).get('/api/bingo/leaderboard');

  // Modify stored progress and rank history timestamps
  const progressPath = path.join(tempDir, 'bingo_progress.json');
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  const user = progress.find(p => p.userId === 'r1');
  user.completedTiles = [1,2,3,4];
  user.updatedAt = new Date().toISOString();
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

  const historyPath = path.join(tempDir, 'rank_history.json');
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  Object.keys(history).forEach(k => {
    history[k].timestamp = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  jest.resetModules();
  app = require('../server');

  const res = await request(app).get('/api/bingo/leaderboard');
  expect(res.status).toBe(200);
  const e1 = res.body.find(e => e.id === 'r1');
  const e2 = res.body.find(e => e.id === 'r2');
  expect(e1.rankChange).toBeGreaterThan(0);
  expect(e2.rankChange).toBeLessThan(0);
});

test('POST /api/users stores user info and can be retrieved', async () => {
  const user = { userId: 'user42', username: 'Tester', email: 't@example.com' };
  const res = await request(app)
    .post('/api/users')
    .send(user);

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('User info saved');
  expect(res.body.cleaned).toBe(true);

  const getRes = await request(app).get('/api/users/user42');
  expect(getRes.status).toBe(200);
  expect(getRes.body.username).not.toBe('Tester');
  expect(getRes.body.username.toLowerCase()).not.toContain('test');
  expect(getRes.body.email).toBe('t@example.com');
});

test('GET /api/bingo/lines/:userId returns line count', async () => {
  const tiles = [0, 1, 2, 3, 4, 6, 11, 16, 21, 12, 18, 24];
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'lineUser', username: 'Lines', completedTiles: tiles });

  const res = await request(app).get('/api/bingo/lines/lineUser');
  expect(res.status).toBe(200);
  expect(res.body.lines).toBe(3);
});

test('Submitting zero completed tiles resets leaderboard score', async () => {
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'resetUser', username: 'Reset', completedTiles: [1, 2] });

  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'resetUser', username: 'Reset', completedTiles: [] });

  const res = await request(app).get('/api/bingo/leaderboard');
  expect(res.status).toBe(200);
  const entry = res.body.find(e => e.playerName === 'Reset');
  expect(entry).toBeTruthy();
  expect(entry.score).toBe(0);
});

test('Username is sanitized in bingo progress', async () => {
  await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'cleanUser', username: 'Bad@Name!!', completedTiles: [1] });

  const res = await request(app).get('/api/bingo/leaderboard');
  expect(res.status).toBe(200);
  const entry = res.body.find(e => e.playerName === 'BadName');
  expect(entry).toBeTruthy();
  expect(entry.score).toBe(1);
});

test('Leaderboard POST sanitizes username and returns flag', async () => {
  const res = await request(app)
    .post('/api/bingo/leaderboard')
    .send({ playerId: 'p1', playerName: 'Messy#User', score: 3 });

  expect(res.status).toBe(200);
  expect(res.body.cleaned).toBe(true);

  const lbRes = await request(app).get('/api/bingo/leaderboard');
  const entry = lbRes.body.find(e => e.id === 'p1');
  expect(entry).toBeTruthy();
  expect(entry.playerName).not.toBe('Messy#User');
  expect(entry.playerName.toLowerCase()).not.toContain('user');
  expect(entry.score).toBe(3);
});

test('Blocked word is cleaned in bingo progress', async () => {
  const progressRes = await request(app)
    .post('/api/bingo/progress')
    .send({ userId: 'blocked1', username: 'damnUser', completedTiles: [] });

  expect(progressRes.status).toBe(200);
  expect(progressRes.body.cleaned).toBe(true);

  const lbRes = await request(app).get('/api/bingo/leaderboard');
  const entry = lbRes.body.find(e => e.id === 'blocked1');
  expect(entry).toBeTruthy();
  expect(entry.playerName).not.toBe('damnUser');
  expect(entry.playerName.toLowerCase()).not.toContain('damn');
});

test('Blocked username cleaned when storing user info', async () => {
  const res = await request(app)
    .post('/api/users')
    .send({ userId: 'userbad', username: 'poop', email: 'b@example.com' });

  expect(res.status).toBe(200);
  expect(res.body.cleaned).toBe(true);

  const getRes = await request(app).get('/api/users/userbad');
  expect(getRes.status).toBe(200);
  expect(getRes.body.username).not.toBe('poop');
  expect(getRes.body.username.toLowerCase()).not.toContain('poop');
});
