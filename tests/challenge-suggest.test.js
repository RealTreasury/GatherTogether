const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

test('submit adds challenge suggestion to Firestore', async () => {
  const dom = new JSDOM(`<!DOCTYPE html><button id="suggest-challenge-btn"></button>`);
  const context = {
    window: dom.window,
    document: dom.window.document,
    console,
    Utils: { showNotification: jest.fn(), getUserId: () => 'tester' },
    firestoreModules: {
      collection: jest.fn(() => 'col'),
      addDoc: jest.fn(() => Promise.resolve())
    },
    firebaseDB: {}
  };
  context.window.Utils = context.Utils;
  context.window.firestoreModules = context.firestoreModules;
  context.window.firebaseDB = context.firebaseDB;

  vm.createContext(context);
  const code = fs.readFileSync(path.join(__dirname, '../scripts/challenge-suggest.js'), 'utf8');
  vm.runInContext(code, context);

  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

  dom.window.document.getElementById('suggest-challenge-btn').click();
  const textarea = dom.window.document.querySelector('.challenge-suggest-input');
  textarea.value = 'Do a new thing';
  dom.window.document.getElementById('challenge-submit-btn').click();
  await new Promise(r => setImmediate(r));

  expect(context.firestoreModules.addDoc).toHaveBeenCalledWith('col', expect.objectContaining({
    text: 'Do a new thing',
    userId: 'tester'
  }));
});
