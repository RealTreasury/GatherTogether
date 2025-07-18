const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('getTotalPoints sums points from both modes', () => {
  const code = fs.readFileSync(path.join(__dirname, '../scripts/bingo.js'), 'utf8');
  const context = { console };
  vm.createContext(context);
  vm.runInContext(code, context);
  const BingoTracker = vm.runInContext('BingoTracker', context);

  BingoTracker.completedTiles.regular = new Set([1, 2]);
  BingoTracker.completedTiles.completionist = new Set([0]);
  BingoTracker.subItemProgress = { 0: { 0: true, 1: true } };

  const total = BingoTracker.getTotalPoints();
  expect(total).toBe(5); // 2 regular + (2 sub items + 1 tile)
});

test('getTotalProgressPercent reflects overall completion', () => {
  const code = fs.readFileSync(path.join(__dirname, '../scripts/bingo.js'), 'utf8');
  const context = { console };
  vm.createContext(context);
  vm.runInContext(code, context);
  const BingoTracker = vm.runInContext('BingoTracker', context);

  BingoTracker.completedTiles.regular = new Set([1]);
  BingoTracker.completedTiles.completionist = new Set([0]);
  BingoTracker.subItemProgress = { 0: { 0: true } };

  const earned = BingoTracker.getTotalPoints();
  const possible = BingoTracker.getTotalPossiblePoints();
  const percent = BingoTracker.getTotalProgressPercent();
  expect(percent).toBe(Math.round((earned / possible) * 100));
});
