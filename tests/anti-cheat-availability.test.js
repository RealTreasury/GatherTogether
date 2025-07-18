const AntiCheat = require('../scripts/anti-cheat-system');

describe('challenge availability schedule', () => {
  const originalGetDay = AntiCheat.eventConfig.getDayOfEvent;

  afterEach(() => {
    AntiCheat.eventConfig.getDayOfEvent = originalGetDay;
  });

  test('convention center games unlock on day 3', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 2;
    expect(AntiCheat.isChallengeAvailable('completionist', 3)).toBe(false);
    AntiCheat.eventConfig.getDayOfEvent = () => 3;
    expect(AntiCheat.isChallengeAvailable('completionist', 3)).toBe(true);
  });

  test('sessions and booths unlock on day 4', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 3;
    expect(AntiCheat.isChallengeAvailable('completionist', 4)).toBe(false);
    expect(AntiCheat.isChallengeAvailable('completionist', 14)).toBe(false);
    AntiCheat.eventConfig.getDayOfEvent = () => 4;
    expect(AntiCheat.isChallengeAvailable('completionist', 4)).toBe(true);
    expect(AntiCheat.isChallengeAvailable('completionist', 14)).toBe(true);
  });

  test('daily acts of kindness available from start', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    expect(AntiCheat.isChallengeAvailable('completionist', 11)).toBe(true);
  });
});
