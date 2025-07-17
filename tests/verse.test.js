const { JSDOM } = require('jsdom');

describe('VerseManager API refresh', () => {
  let VerseManager;

  beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><div class="verse-text"></div><div class="verse-reference"></div>`);
    global.window = dom.window;
    global.document = dom.window.document;
    global.Utils = { showNotification: jest.fn() };
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        verses: [{ text: 'Test verse', book_name: 'Test', chapter: 1, verse: 1 }]
      })
    }));
  });

  afterEach(() => {
    jest.resetModules();
    delete global.window;
    delete global.document;
    delete global.Utils;
    delete global.fetch;
  });

  test('refresh displays verse from API', async () => {
    require('../public/scripts/verse.js');
    VerseManager = window.VerseManager;
    await VerseManager.refresh();
    expect(VerseManager.currentVerse.text).toBe('Test verse');
    expect(document.querySelector('.verse-text').textContent).toBe('Test verse');
  });
});
