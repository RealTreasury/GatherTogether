const AntiCheat = require('../scripts/anti-cheat-system');

describe('rapid completion rate limiting', () => {
  beforeEach(() => {
    // reset tracking
    AntiCheat.flaggedUsers.clear();
    AntiCheat.lastActions = {};
    AntiCheat.cooldownMs = 0;
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

  test('brief cooldown prevents immediate repeat', () => {
    const user = 'cooldownUser';
    AntiCheat.cooldownMs = 1000; // 1 second
    const first = AntiCheat.recordTileCompletion(user, 0);
    expect(first.allowed).toBe(true);
    const second = AntiCheat.recordTileCompletion(user, 1);
    expect(second.allowed).toBe(false);
    expect(second.type).toBe('cooldown');
  });
});
