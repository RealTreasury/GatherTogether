const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

test('displays warning when username is blocked', () => {
  const dom = new JSDOM('<!DOCTYPE html><div id="username-container"><input id="username"></div>');
  const context = {
    window: dom.window,
    document: dom.window.document,
    console,
    Utils: { debounce: fn => fn },
    UsernameValidator: {
      validateWithFeedback: jest.fn(() => ({
        isValid: false,
        cleanUsername: 'Clean',
        message: 'Please choose a more appropriate username'
      }))
    }
  };
  context.window.Utils = context.Utils;
  context.window.UsernameValidator = context.UsernameValidator;

  vm.createContext(context);
  const code = fs.readFileSync(path.join(__dirname, '../scripts/username-feedback.js'), 'utf8');
  vm.runInContext(code, context);

  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const input = dom.window.document.getElementById('username');
  input.value = 'bad';
  input.dispatchEvent(new dom.window.Event('input'));

  const feedback = dom.window.document.getElementById('username-feedback');
  expect(feedback.textContent).toBe('Please choose a more appropriate username Using: "Clean"');
  expect(feedback.classList.contains('warning')).toBe(true);
  expect(input.classList.contains('invalid')).toBe(true);
});
