const AntiCheat = require('../scripts/anti-cheat-system');

describe('challenge availability schedule', () => {
  const originalGetDay = AntiCheat.eventConfig.getDayOfEvent;

  afterEach(() => {
    AntiCheat.eventConfig.getDayOfEvent = originalGetDay;
  });

  test('convention center games available from day 1', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    expect(AntiCheat.isChallengeAvailable('completionist', 14)).toBe(true);
    AntiCheat.eventConfig.getDayOfEvent = () => 3;
    expect(AntiCheat.isChallengeAvailable('completionist', 12)).toBe(true);
  });

  test('sessions and booths available from day 1', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    expect(AntiCheat.isChallengeAvailable('completionist', 11)).toBe(true);
    expect(AntiCheat.isChallengeAvailable('completionist', 4)).toBe(true);
  });

  test('daily acts of kindness available from start', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    expect(AntiCheat.isChallengeAvailable('completionist', 9)).toBe(true);
  });

  test('hair color challenge available from day 1', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    expect(AntiCheat.isChallengeAvailable('completionist', 15)).toBe(true);
  });

  test('photos with main speakers available from day 1', () => {
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    expect(AntiCheat.isChallengeAvailable('completionist', 13)).toBe(true);
  });

  test('mass event hard mode challenge unlocks at 7:30pm CT', () => {
    jest.useFakeTimers();
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    jest.setSystemTime(new Date('2025-07-19T19:29:00-05:00'));
    expect(AntiCheat.isChallengeAvailable('completionist', 10)).toBe(false);
    jest.setSystemTime(new Date('2025-07-19T19:31:00-05:00'));
    expect(AntiCheat.isChallengeAvailable('completionist', 10)).toBe(true);
    jest.useRealTimers();
  });

  test('communion challenge only available on Wednesday', () => {
    jest.useFakeTimers();
    // Monday of event
    jest.setSystemTime(new Date('2025-07-21T10:00:00Z'));
    AntiCheat.eventConfig.getDayOfEvent = () => 5;
    expect(AntiCheat.isChallengeAvailable('regular', 7)).toBe(false);

    // Wednesday of event
    jest.setSystemTime(new Date('2025-07-23T10:00:00Z'));
    AntiCheat.eventConfig.getDayOfEvent = () => 7;
    expect(AntiCheat.isChallengeAvailable('regular', 7)).toBe(true);

    jest.useRealTimers();
  });

  test('mass event challenge available from day 1 regardless of time', () => {
    jest.useFakeTimers();
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    jest.setSystemTime(new Date('2025-07-19T19:00:00-05:00'));
    expect(AntiCheat.isChallengeAvailable('regular', 2)).toBe(true);
    jest.setSystemTime(new Date('2025-07-19T19:31:00-05:00'));
    expect(AntiCheat.isChallengeAvailable('regular', 2)).toBe(true);
    jest.useRealTimers();
  });

  test('mass event plus challenge unlocks at 10pm CT', () => {
    jest.useFakeTimers();
    AntiCheat.eventConfig.getDayOfEvent = () => 1;
    jest.setSystemTime(new Date('2025-07-19T21:59:00-05:00'));
    expect(AntiCheat.isChallengeAvailable('regular', 16)).toBe(false);
    jest.setSystemTime(new Date('2025-07-19T22:01:00-05:00'));
    expect(AntiCheat.isChallengeAvailable('regular', 16)).toBe(true);
    jest.useRealTimers();
  });
});
