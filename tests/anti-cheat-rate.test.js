const AntiCheat = require('../scripts/anti-cheat-system');

describe('rapid completion rate limiting', () => {
  beforeEach(() => {
    // reset tracking
    AntiCheat.flaggedUsers.clear();
    AntiCheat.lastActions = {};
    // allow all challenges
    AntiCheat.isChallengeAvailable = () => true;
  });

  test('bulk logging within limit does not flag', () => {
    const user = 'bulkUser';
    for (let i = 0; i < 30; i++) {
      const res = AntiCheat.recordTileCompletion(user, i);
      expect(res.allowed).toBe(true);
    }
    expect(AntiCheat.flaggedUsers.has(user)).toBe(false);
  });

  test('excessive rapid logging is flagged', () => {
    const user = 'cheater';
    for (let i = 0; i < AntiCheat.maxActionsPerWindow + 1; i++) {
      AntiCheat.recordTileCompletion(user, i);
    }
    expect(AntiCheat.flaggedUsers.has(user)).toBe(true);
  });
});
