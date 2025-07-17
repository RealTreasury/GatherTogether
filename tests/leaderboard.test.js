/**
 * @jest-environment jsdom
 */
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;
const { JSDOM } = require('jsdom');

describe('Leaderboard pending scores', () => {
  let Leaderboard;
  let submitScoreMock;

  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
    global.window = dom.window;
    global.document = dom.window.document;
    global.document.getElementById = jest.fn(() => null);
    global.localStorage = { getItem: jest.fn(), setItem: jest.fn() };
    global.App = { currentTab: '' };
    submitScoreMock = jest.fn().mockResolvedValue(true);
    global.window.FirebaseLeaderboard = function () {
      return {
        init: jest.fn().mockResolvedValue(true),
        isAvailable: () => true,
        submitScore: submitScoreMock,
        subscribeToLeaderboard: jest.fn(),
      };
    };
    global.window.firebaseApp = {};

    require('../scripts/leaderboard.js');
    Leaderboard = global.window.Leaderboard;
    Leaderboard.initializationPromise = Promise.resolve();
    Leaderboard._resolveInitialization = () => {};
  });

  afterEach(() => {
    jest.resetModules();
    delete global.window;
    delete global.document;
    delete global.localStorage;
    delete global.App;
  });

  test('queued scores are flushed after Firebase initializes', async () => {
    // Firebase unavailable when saving score
    Leaderboard.firebaseLeaderboard = null;
    await Leaderboard.saveScore('u1', 'User1', 7);
    expect(Object.keys(Leaderboard.pendingScores)).toHaveLength(1);

    // Initialize Firebase - should flush queued score
    await Leaderboard.initFirebase();

    expect(submitScoreMock).toHaveBeenCalledWith('u1', 'User1', 7);
    expect(Object.keys(Leaderboard.pendingScores)).toHaveLength(0);
  });
});
