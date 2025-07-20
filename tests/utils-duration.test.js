const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('formatDurationShort switches to hours at 90 minutes', () => {
  const code = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(code, context);
  const Utils = vm.runInContext('Utils', context);

  expect(Utils.formatDurationShort(89 * 60 * 1000)).toBe('89m');
  expect(Utils.formatDurationShort(90 * 60 * 1000)).toBe('2h');
});
