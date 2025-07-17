const Validator = require('../scripts/username-validator');

test('detects inappropriate usernames', () => {
  expect(Validator.isInappropriate('damn')).toBe(true);
  expect(Validator.isInappropriate('Alice')).toBe(false);
});

test('cleans or suggests alternative usernames', () => {
  const alt = Validator.getCleanUsername('damn');
  expect(Validator.isInappropriate(alt)).toBe(false);
  expect(alt.length).toBeGreaterThanOrEqual(2);
});

test('validateWithFeedback flags bad names', () => {
  const resultBad = Validator.validateWithFeedback('damn');
  expect(resultBad.isValid).toBe(false);

  const resultGood = Validator.validateWithFeedback('Alice');
  expect(resultGood.isValid).toBe(true);
  expect(resultGood.cleanUsername).toBe('Alice');
});
