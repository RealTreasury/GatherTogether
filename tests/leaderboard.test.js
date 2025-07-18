const { JSDOM } = require('jsdom');

describe('Leaderboard pending score handling', () => {
  let Leaderboard;

  beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><div id="firebase-status"></div>`);
    global.window = dom.window;
    global.document = dom.window.document;
    global.App = { currentTab: 'leaderboard' };
    global.Utils = { getUserId: () => 'u1', showNotification: jest.fn() };
  });

  afterEach(() => {
    jest.resetModules();
    delete global.window;
    delete global.document;
    delete global.App;
    delete global.Utils;
  });

  test('flushes queued scores once Firebase connects', async () => {
    // Mock failing FirebaseLeaderboard to queue score
    class FailFirebaseLeaderboard {
      async init() { return false; }
      isAvailable() { return false; }
      async isUsernameAvailable() { return true; }
      subscribeToLeaderboard() {}
    }
    window.FirebaseLeaderboard = FailFirebaseLeaderboard;
    window.firebaseApp = {};

    require('../scripts/leaderboard.js');
    Leaderboard = window.Leaderboard;
    Leaderboard.init();
    await Leaderboard.initializationPromise;

    await Leaderboard.saveScore('u1', 'Tester', 10);
    expect(Leaderboard.pendingScores['u1']).toBeDefined();

    // Replace with working FirebaseLeaderboard
    class SuccessFirebaseLeaderboard {
      constructor() { this.initialized = false; this.submitted = []; window._fbInstance = this; }
      async init() { this.initialized = true; return true; }
      isAvailable() { return this.initialized; }
      async isUsernameAvailable() { return true; }
      async submitScore(userId, username, score) { this.submitted.push({ userId, username, score }); }
      subscribeToLeaderboard() {}
    }
    window.FirebaseLeaderboard = SuccessFirebaseLeaderboard;

    await Leaderboard.initFirebase();

    const fb = window._fbInstance;
    expect(fb.submitted).toEqual([{ userId: 'u1', username: 'Tester', score: 10 }]);
    expect(Leaderboard.pendingScores['u1']).toBeUndefined();
  });
});
