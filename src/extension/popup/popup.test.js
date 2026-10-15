/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Extension Popup (popup.js)', () => {
  let popupJsCode;
  let onUpdatedListener;

  beforeAll(() => {
    const popupJsPath = path.join(__dirname, 'popup.js');
    popupJsCode = fs.readFileSync(popupJsPath, 'utf8');
  });

  beforeEach(() => {
    onUpdatedListener = null;

    global.window.close = jest.fn();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => {
            if (cb) cb({ theme: 'github-light' });
            return Promise.resolve({ theme: 'github-light' });
          }),
          set: jest.fn((data, cb) => {
            if (cb) cb();
            return Promise.resolve();
          })
        }
      },
      runtime: {
        id: 'mock-ext-id',
        getURL: jest.fn(relPath => `chrome-extension://mock-ext-id/${relPath}`)
      },
      tabs: {
        create: jest.fn((options, cb) => {
          const tab = { id: 99 };
          if (cb) cb(tab);
          return Promise.resolve(tab);
        }),
        sendMessage: jest.fn(),
        onUpdated: {
          addListener: jest.fn(fn => {
            onUpdatedListener = fn;
          }),
          removeListener: jest.fn()
        }
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupDOMAndInitPopup() {
    document.body.innerHTML = `
      <button id="btn-open-workspace"></button>
      <button id="btn-open-file"></button>
      <input type="file" id="file-input-picker" />
      <select id="theme-select">
        <option value="github-dark">github-dark</option>
        <option value="github-light">github-light</option>
        <option value="dracula">dracula</option>
      </select>
      <button id="btn-open-extensions-page"></button>
    `;

    // Intercept addEventListener so DOMContentLoaded fires immediately and uniquely per test
    let domLoadedHandler = null;
    const originalAddEventListener = document.addEventListener.bind(document);
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation((event, handler, options) => {
      if (event === 'DOMContentLoaded') {
        domLoadedHandler = handler;
      } else {
        originalAddEventListener(event, handler, options);
      }
    });

    const fn = new Function('chrome', 'window', 'document', popupJsCode);
    fn(global.chrome, global.window, global.document);

    if (domLoadedHandler) {
      domLoadedHandler();
    }

    addEventListenerSpy.mockRestore();
  }

  it('should load stored theme on DOMContentLoaded', () => {
    setupDOMAndInitPopup();

    expect(chrome.storage.local.get).toHaveBeenCalledWith(['theme'], expect.any(Function));
    const themeSelect = document.getElementById('theme-select');
    expect(themeSelect.value).toBe('github-light');
  });

  it('should do nothing if stored theme is empty', () => {
    chrome.storage.local.get.mockImplementation((keys, cb) => {
      if (cb) cb({});
      return Promise.resolve({});
    });

    setupDOMAndInitPopup();

    const themeSelect = document.getElementById('theme-select');
    expect(themeSelect.value).toBe('github-dark'); // Default first option in HTML
  });

  it('should save theme when theme select value changes', () => {
    setupDOMAndInitPopup();

    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = 'dracula';
    themeSelect.dispatchEvent(new Event('change'));

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ theme: 'dracula' });
  });

  it('should open workspace viewer tab and close popup on btnWorkspace click', () => {
    setupDOMAndInitPopup();

    const btnWorkspace = document.getElementById('btn-open-workspace');
    btnWorkspace.click();

    expect(chrome.runtime.getURL).toHaveBeenCalledWith('viewer/viewer.html');
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://mock-ext-id/viewer/viewer.html'
    });
    expect(window.close).toHaveBeenCalled();
  });

  it('should trigger file input click on btnOpenFile click', () => {
    setupDOMAndInitPopup();

    const btnOpenFile = document.getElementById('btn-open-file');
    const fileInput = document.getElementById('file-input-picker');

    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

    btnOpenFile.click();

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('should do nothing if file input change event fires without files', async () => {
    setupDOMAndInitPopup();

    const fileInput = document.getElementById('file-input-picker');

    Object.defineProperty(fileInput, 'files', {
      value: [],
      writable: true,
      configurable: true
    });

    fileInput.dispatchEvent(new Event('change'));

    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it('should handle file input change event, create viewer tab, and send initial doc when tab status is complete', async () => {
    setupDOMAndInitPopup();

    const fileInput = document.getElementById('file-input-picker');
    const mockFile = {
      name: 'test-document.md',
      text: jest.fn().mockResolvedValue('# Test Document Content')
    };

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: true,
      configurable: true
    });

    // Trigger change event and await async handler microtasks
    fileInput.dispatchEvent(new Event('change'));

    // Wait for file.text() resolution
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockFile.text).toHaveBeenCalled();
    expect(chrome.runtime.getURL).toHaveBeenCalledWith('viewer/viewer.html');
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      { url: 'chrome-extension://mock-ext-id/viewer/viewer.html' },
      expect.any(Function)
    );
    expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledWith(expect.any(Function));
    expect(window.close).toHaveBeenCalled();

    // Verify onUpdated listener behavior
    expect(onUpdatedListener).toBeDefined();

    // Test listener with non-matching tabId or non-complete status
    onUpdatedListener(999, { status: 'complete' });
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();

    onUpdatedListener(99, { status: 'loading' });
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();

    // Test listener with matching tabId and complete status
    onUpdatedListener(99, { status: 'complete' });

    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalledWith(onUpdatedListener);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(99, {
      action: 'loadInitialDoc',
      filename: 'test-document.md',
      content: '# Test Document Content'
    });
  });

  it('should open extensions page with extension ID and close popup on btnConfigTip click', () => {
    setupDOMAndInitPopup();

    const btnConfigTip = document.getElementById('btn-open-extensions-page');
    btnConfigTip.click();

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome://extensions/?id=mock-ext-id'
    });
    expect(window.close).toHaveBeenCalled();
  });
});
