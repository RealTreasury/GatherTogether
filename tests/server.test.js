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
  expect(leaderboardRes.body[0]).toEqual({
    username: progress.username,
    score: progress.completedTiles.length,
  });
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
  expect(res.body[0]).toEqual({ username: 'User1', score: 5 });
  expect(res.body[1]).toEqual({ username: 'User2', score: 3 });
});
