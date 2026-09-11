const fs = require('fs');
const path = require('path');
const Store = require('./store');

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  statSync: jest.fn(),
  promises: {
    access: jest.fn(),
    readFile: jest.fn()
  }
}));
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name) => {
      if (name === 'userData') return '/mock/user/data/path';
      if (name === 'documents') return '/mock/documents';
      if (name === 'home') return '/mock/home';
      return `/mock/${name}`;
    })
  }
}));

describe('Store', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default paths and values', async () => {
      // Setup mock to simulate missing settings file
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.promises.access.mockRejectedValue(error);

      const store = new Store();
      await store.init();

      expect(store.userDataPath).toBe('/mock/user/data/path');
      expect(store.filePath).toBe(path.join('/mock/user/data/path', 'mdviewer-settings.json'));

      const defaultSettings = {
        theme: 'github-dark',
        fontSize: 16,
        zoomLevel: 1.0,
        recentFiles: [],
        recentFolders: [],
        lastOpenedFolder: null,
        lastDirectory: null,
        sidebarVisible: true,
        sidebarTab: 'explorer',
        viewMode: 'preview',
        liveWatch: true,
        lineNumbers: true,
        windowBounds: { width: 1200, height: 800, x: undefined, y: undefined }
      };

      expect(store.defaults).toEqual(defaultSettings);
      expect(store.data).toEqual(defaultSettings);

      // Should not try to read since it doesn't exist
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });

    it('should load settings from file if it exists and merge with defaults', async () => {
      const existingSettings = {
        theme: 'light',
        fontSize: 18,
        sidebarVisible: false
      };

      fs.promises.access.mockResolvedValue(undefined);
      fs.promises.readFile.mockResolvedValue(JSON.stringify(existingSettings));

      const store = new Store();
      await store.init();

      // Check if it merged correctly
      expect(store.data.theme).toBe('light');
      expect(store.data.fontSize).toBe(18);
      expect(store.data.sidebarVisible).toBe(false);

      // Defaults should be preserved for missing properties
      expect(store.data.zoomLevel).toBe(1.0);
      expect(store.data.liveWatch).toBe(true);

      expect(fs.promises.readFile).toHaveBeenCalledWith(store.filePath, 'utf-8');
    });

    it('should fallback to defaults if reading file fails', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      fs.promises.readFile.mockRejectedValue(new Error('Failed to read file'));

      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const store = new Store();
      await store.init();

      expect(store.data).toEqual(store.defaults);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should fallback to defaults if JSON is invalid', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      fs.promises.readFile.mockResolvedValue('{ invalid json }');

      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const store = new Store();
      await store.init();

      expect(store.data).toEqual(store.defaults);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
