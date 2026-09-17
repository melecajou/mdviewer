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
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading settings:', expect.any(Error));

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
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading settings:', expect.any(SyntaxError));

      consoleErrorSpy.mockRestore();
    });

    it('should fallback to defaults and handle JSON parse error on empty string', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      fs.promises.readFile.mockResolvedValue('{ "invalid" }');

      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const store = new Store();
      await store.init();

      expect(store.data).toEqual(store.defaults);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading settings:', expect.any(SyntaxError));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getLastDirectory', () => {
    let store;

    beforeEach(() => {
      fs.existsSync.mockReturnValue(false); // Default false for initialization
      store = new Store();
      jest.clearAllMocks(); // Clear after init
    });

    // Helper to mock directory vs file existence
    const mockFs = (dirs = [], files = [], throwFor = []) => {
      fs.existsSync.mockImplementation((p) => {
        if (throwFor.includes(p)) throw new Error('fs error');
        return dirs.includes(p) || files.includes(p);
      });
      fs.statSync.mockImplementation((p) => {
        if (throwFor.includes(p)) throw new Error('fs error');
        if (dirs.includes(p)) return { isDirectory: () => true };
        if (files.includes(p)) return { isDirectory: () => false };
        throw new Error('ENOENT');
      });
    };

    it('should return preferredPath if it is a valid directory', () => {
      mockFs(['/valid/dir']);
      expect(store.getLastDirectory('/valid/dir')).toBe('/valid/dir');
    });

    it('should return parent of preferredPath if preferredPath is a file', () => {
      mockFs(['/valid'], ['/valid/file.txt']);
      expect(store.getLastDirectory('/valid/file.txt')).toBe('/valid');
    });

    it('should fallback to lastDirectory if preferredPath is invalid', () => {
      store.data.lastDirectory = '/last/dir';
      mockFs(['/last/dir']);
      expect(store.getLastDirectory('/invalid')).toBe('/last/dir');
      expect(store.getLastDirectory()).toBe('/last/dir');
    });

    it('should fallback to lastOpenedFolder if lastDirectory is invalid', () => {
      store.data.lastDirectory = '/invalid/last/dir';
      store.data.lastOpenedFolder = '/last/opened';
      mockFs(['/last/opened']);
      expect(store.getLastDirectory()).toBe('/last/opened');
    });

    it('should fallback to valid parent of a recent file', () => {
      store.data.recentFiles = ['/invalid/file.txt', '/recent/valid/file.txt'];
      mockFs(['/recent/valid'], ['/recent/valid/file.txt']);
      expect(store.getLastDirectory()).toBe('/recent/valid');
    });

    it('should fallback to valid recent folder', () => {
      store.data.recentFolders = ['/invalid/folder', '/recent/folder'];
      mockFs(['/recent/folder']);
      expect(store.getLastDirectory()).toBe('/recent/folder');
    });

    it('should fallback to documents path', () => {
      mockFs(['/mock/documents']);
      expect(store.getLastDirectory()).toBe('/mock/documents');
    });

    it('should fallback to home path if documents is invalid', () => {
      mockFs(['/mock/home']);
      expect(store.getLastDirectory()).toBe('/mock/home');
    });

    it('should return undefined if all paths are invalid', () => {
      mockFs([]);
      expect(store.getLastDirectory()).toBeUndefined();
    });

    it('should gracefully handle exceptions during path validation', () => {
      store.data.lastDirectory = '/error/dir';
      store.data.lastOpenedFolder = '/valid/opened';

      // /error/dir throws, but we expect it to catch and continue to the next valid option
      mockFs(['/valid/opened'], [], ['/error/dir']);

      expect(store.getLastDirectory()).toBe('/valid/opened');
    });
  });
});
