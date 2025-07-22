const AntiCheat = require('../scripts/anti-cheat-system');

describe('challenge availability always true', () => {
  test('all challenges available regardless of day', () => {
    for (let mode of ['regular', 'completionist']) {
      for (let i = 0; i < 20; i++) {
        expect(AntiCheat.isChallengeAvailable(mode, i)).toBe(true);
      }
    }
  });
});
