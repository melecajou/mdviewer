const fs = require('fs');
const path = require('path');

describe('Extension Background Script (background.js)', () => {
  let onInstalledListener;
  let onClickedListener;
  let onMessageListener;

  beforeEach(() => {
    onInstalledListener = null;
    onClickedListener = null;
    onMessageListener = null;

    global.chrome = {
      runtime: {
        onInstalled: {
          addListener: jest.fn((fn) => {
            onInstalledListener = fn;
          })
        },
        onMessage: {
          addListener: jest.fn((fn) => {
            onMessageListener = fn;
          })
        },
        getURL: jest.fn((p) => `chrome-extension://mock-id/${p}`)
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: {
          addListener: jest.fn((fn) => {
            onClickedListener = fn;
          })
        }
      },
      tabs: {
        create: jest.fn(),
        sendMessage: jest.fn(),
        onUpdated: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      }
    };

    const bgJsPath = path.join(__dirname, 'background.js');
    const bgJsCode = fs.readFileSync(bgJsPath, 'utf8');
    eval(bgJsCode);
  });

  afterEach(() => {
    delete global.chrome;
  });

  describe('onInstalled event handler', () => {
    it('should set default storage settings if no theme is stored', () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      onInstalledListener();

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        ['theme', 'zoomLevel', 'viewMode'],
        expect.any(Function)
      );
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        theme: 'github-dark',
        zoomLevel: 1.0,
        viewMode: 'preview',
        recentFiles: []
      });
      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: 'open-in-mdviewer',
        title: 'Abrir no MDViewer Workspace',
        contexts: ['link', 'page']
      });
    });

    it('should not overwrite storage settings if theme is already stored', () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ theme: 'github-light' });
      });

      onInstalledListener();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
      expect(chrome.contextMenus.create).toHaveBeenCalled();
    });
  });

  describe('contextMenus.onClicked event handler', () => {
    it('should open viewer tab with linkUrl when context menu item is clicked', () => {
      const info = {
        menuItemId: 'open-in-mdviewer',
        linkUrl: 'https://example.com/doc.md'
      };

      onClickedListener(info);

      expect(chrome.runtime.getURL).toHaveBeenCalledWith('viewer/viewer.html');
      expect(chrome.tabs.create).toHaveBeenCalledWith(
        { url: 'chrome-extension://mock-id/viewer/viewer.html' },
        expect.any(Function)
      );
    });

    it('should fallback to pageUrl if linkUrl is not present', () => {
      const info = {
        menuItemId: 'open-in-mdviewer',
        pageUrl: 'https://example.com/page.md'
      };

      onClickedListener(info);

      expect(chrome.tabs.create).toHaveBeenCalled();
    });

    it('should ignore context menu clicks for other menu items', () => {
      const info = {
        menuItemId: 'other-menu-item',
        linkUrl: 'https://example.com/doc.md'
      };

      onClickedListener(info);

      expect(chrome.tabs.create).not.toHaveBeenCalled();
    });
  });

  describe('runtime.onMessage event handler', () => {
    it('should handle "openViewer" action and respond with success', () => {
      const message = {
        action: 'openViewer',
        url: 'https://example.com/file.md',
        content: '# Test',
        filename: 'file.md'
      };
      const sendResponse = jest.fn();

      const result = onMessageListener(message, {}, sendResponse);

      expect(result).toBe(true);
      expect(chrome.tabs.create).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle "getSettings" action asynchronously', () => {
      const mockSettings = { theme: 'github-dark', zoomLevel: 1.0 };
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockSettings);
      });
      const message = { action: 'getSettings' };
      const sendResponse = jest.fn();

      const result = onMessageListener(message, {}, sendResponse);

      expect(result).toBe(true);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        ['theme', 'zoomLevel', 'viewMode', 'recentFiles'],
        expect.any(Function)
      );
      expect(sendResponse).toHaveBeenCalledWith(mockSettings);
    });

    it('should handle "saveSettings" action and respond with success', () => {
      const settingsToSave = { theme: 'github-light', zoomLevel: 1.2 };
      chrome.storage.local.set.mockImplementation((settings, callback) => {
        callback();
      });
      const message = { action: 'saveSettings', settings: settingsToSave };
      const sendResponse = jest.fn();

      const result = onMessageListener(message, {}, sendResponse);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        settingsToSave,
        expect.any(Function)
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should ignore unknown message actions', () => {
      const message = { action: 'unknownAction' };
      const sendResponse = jest.fn();

      const result = onMessageListener(message, {}, sendResponse);

      expect(result).toBeUndefined();
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('openViewerTab function & tab load listener', () => {
    it('should attach onUpdated listener and send loadInitialDoc message when tab loads complete', () => {
      let createTabCallback;
      chrome.tabs.create.mockImplementation((options, callback) => {
        createTabCallback = callback;
      });

      let tabUpdatedListener;
      chrome.tabs.onUpdated.addListener.mockImplementation((fn) => {
        tabUpdatedListener = fn;
      });

      const message = {
        action: 'openViewer',
        url: 'https://example.com/test.md',
        content: '# Hello',
        filename: 'test.md'
      };
      onMessageListener(message, {}, jest.fn());

      // Simulate tab created with ID 123
      const mockTab = { id: 123 };
      createTabCallback(mockTab);

      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(tabUpdatedListener).toBeDefined();

      // Simulate onUpdated trigger for a different tab or incomplete status
      tabUpdatedListener(999, { status: 'complete' });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();

      tabUpdatedListener(123, { status: 'loading' });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();

      // Simulate onUpdated trigger for tab 123 with status 'complete'
      tabUpdatedListener(123, { status: 'complete' });

      expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalledWith(tabUpdatedListener);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'loadInitialDoc',
        url: 'https://example.com/test.md',
        content: '# Hello',
        filename: 'test.md'
      });
    });

    it('should not attach onUpdated listener when neither url nor content is provided', () => {
      let createTabCallback;
      chrome.tabs.create.mockImplementation((options, callback) => {
        createTabCallback = callback;
      });

      const message = { action: 'openViewer', url: null, content: null, filename: null };
      onMessageListener(message, {}, jest.fn());

      createTabCallback({ id: 456 });

      expect(chrome.tabs.onUpdated.addListener).not.toHaveBeenCalled();
    });
  });
});
