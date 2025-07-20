const { JSDOM } = require('jsdom');

describe('HardMode challenge basics', () => {
  let HardMode;
  beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><div id="hardmode-count"></div><div id="hardmode-progress"></div>`);
    global.window = dom.window;
    global.document = dom.window.document;
    global.Storage = {
      KEYS: { HARDMODE_SESSIONS: 'hm_s', HARDMODE_RELEASES: 'hm_r' },
      load: jest.fn(() => []),
      save: jest.fn()
    };
    global.Utils = { showNotification: jest.fn() };
    require('../scripts/hardmode.js');
    HardMode = window.HardMode;
  });

  afterEach(() => {
    jest.resetModules();
    delete global.window;
    delete global.document;
    delete global.Storage;
    delete global.Utils;
  });

  test('addSession stores unique sessions', () => {
    HardMode.init();
    HardMode.addSession('S1');
    HardMode.addSession('S1');
    expect(HardMode.sessions.length).toBe(1);
  });

  test('checkSchedule triggers start action', () => {
    HardMode.buildSchedule = () => {
      HardMode.schedule = [{ time: new Date(Date.now() - 1000), action: 'start' }];
    };
    HardMode.init();
    expect(Utils.showNotification).toHaveBeenCalled();
  });
});
