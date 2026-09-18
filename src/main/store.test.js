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

    it('should fallback to defaults and handle empty file string on init', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      fs.promises.readFile.mockResolvedValue(''); // Empty string

      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const store = new Store();
      await store.init();

      expect(store.data).toEqual(store.defaults);
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setLastDirectory', () => {
    let store;

    beforeEach(() => {
      store = new Store();
      store.save = jest.fn(); // Mock save to prevent file writes during tests
      jest.clearAllMocks();
    });

    it('should ignore falsy and non-string inputs', () => {
      store.setLastDirectory(null);
      store.setLastDirectory(undefined);
      store.setLastDirectory('');
      store.setLastDirectory(123);
      store.setLastDirectory({});

      expect(store.data.lastDirectory).toBeNull();
      expect(store.save).not.toHaveBeenCalled();
    });

    it('should not update if the provided path does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      store.setLastDirectory('/non/existent/path');

      expect(store.data.lastDirectory).toBeNull();
      expect(store.save).not.toHaveBeenCalled();
    });

    it('should set lastDirectory to resolved path if it exists and is a directory', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isDirectory: () => true });

      // Assuming path.resolve just normalizes it in tests
      const testPath = path.resolve('/valid/dir');
      store.setLastDirectory(testPath);

      expect(store.data.lastDirectory).toBe(testPath);
      expect(store.save).toHaveBeenCalled();
    });

    it('should set lastDirectory to parent directory if path exists but is a file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isDirectory: () => false });

      const testPath = path.resolve('/valid/dir/file.txt');
      const expectedDir = path.dirname(testPath);

      store.setLastDirectory(testPath);

      expect(store.data.lastDirectory).toBe(expectedDir);
      expect(store.save).toHaveBeenCalled();
    });

    it('should gracefully handle exceptions and preserve original state', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Test filesystem error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      store.setLastDirectory('/error/path');

      expect(store.data.lastDirectory).toBeNull(); // Should not have changed
      expect(store.save).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error setting last directory:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addRecentFile', () => {
    let store;

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      store = new Store();
      store.save = jest.fn();
      store.data.recentFiles = [];
    });

    it('should do nothing if filePath is missing or not a string', () => {
      store.addRecentFile();
      store.addRecentFile(null);
      store.addRecentFile(123);
      store.addRecentFile({});

      expect(store.data.recentFiles).toEqual([]);
      expect(store.save).not.toHaveBeenCalled();
    });

    it('should add a new file to the beginning of recentFiles and call save()', () => {
      store.data.recentFiles = ['/existing/file.txt'];
      const newFile = '/new/file.md';

      store.addRecentFile(newFile);

      expect(store.data.recentFiles).toEqual([
        path.resolve(newFile),
        '/existing/file.txt'
      ]);
      expect(store.save).toHaveBeenCalled();
    });

    it('should move an existing file to the beginning of recentFiles', () => {
      store.data.recentFiles = ['/file1.txt', '/file2.txt', '/file3.txt'];
      const fileToMove = '/file2.txt';

      store.addRecentFile(fileToMove);

      expect(store.data.recentFiles).toEqual([
        path.resolve(fileToMove),
        '/file1.txt',
        '/file3.txt'
      ]);
      expect(store.save).toHaveBeenCalled();
    });

    it('should truncate recentFiles to 20 items', () => {
      store.data.recentFiles = Array.from({ length: 20 }, (_, i) => `/file${i}.txt`);
      const newFile = '/new/file.md';

      store.addRecentFile(newFile);

      expect(store.data.recentFiles.length).toBe(20);
      expect(store.data.recentFiles[0]).toBe(path.resolve(newFile));
      expect(store.data.recentFiles[19]).toBe('/file18.txt');
    });

    it('should set lastDirectory if the directory of the file exists', () => {
      const newFile = '/path/to/existing/dir/file.md';
      fs.existsSync.mockImplementation((p) => p === path.dirname(path.resolve(newFile)));

      store.addRecentFile(newFile);

      expect(store.data.lastDirectory).toBe(path.dirname(path.resolve(newFile)));
      expect(store.save).toHaveBeenCalled();
    });

    it('should not set lastDirectory if the directory of the file does not exist', () => {
      const newFile = '/path/to/nonexistent/dir/file.md';
      store.data.lastDirectory = '/previous/last/dir';
      fs.existsSync.mockReturnValue(false);

      store.addRecentFile(newFile);

      expect(store.data.lastDirectory).toBe('/previous/last/dir');
      expect(store.save).toHaveBeenCalled();
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

  describe('addRecentFolder', () => {
    let store;

    beforeEach(() => {
      store = new Store();
      store.save = jest.fn(); // Mock save to prevent file writes
      jest.clearAllMocks();
    });

    it('should do nothing if folderPath is missing or invalid type', () => {
      store.addRecentFolder(null);
      store.addRecentFolder(undefined);
      store.addRecentFolder(123);
      store.addRecentFolder({});

      expect(store.data.recentFolders).toEqual([]);
      expect(store.save).not.toHaveBeenCalled();
    });

    it('should add a new folder to the beginning of recentFolders and call save', () => {
      store.addRecentFolder('/some/new/folder');

      expect(store.data.recentFolders).toEqual([path.resolve('/some/new/folder')]);
      expect(store.save).toHaveBeenCalledTimes(1);
    });

    it('should remove existing occurrence of the folder and move it to the front', () => {
      store.data.recentFolders = [
        path.resolve('/folder/1'),
        path.resolve('/folder/2'),
        path.resolve('/folder/3')
      ];

      store.addRecentFolder('/folder/2');

      expect(store.data.recentFolders).toEqual([
        path.resolve('/folder/2'),
        path.resolve('/folder/1'),
        path.resolve('/folder/3')
      ]);
      expect(store.save).toHaveBeenCalledTimes(1);
    });

    it('should truncate recentFolders to 10 items if limit is exceeded', () => {
      // Add 10 dummy folders
      const dummyFolders = Array.from({ length: 10 }, (_, i) => path.resolve(`/folder/${i}`));
      store.data.recentFolders = [...dummyFolders];

      store.addRecentFolder('/new/folder');

      expect(store.data.recentFolders.length).toBe(10);
      expect(store.data.recentFolders[0]).toBe(path.resolve('/new/folder'));
      // The last element should be the 9th dummy folder
      expect(store.data.recentFolders[9]).toBe(dummyFolders[8]);
    });

    it('should set lastDirectory if the folder exists on disk', () => {
      fs.existsSync.mockImplementation((p) => p === path.resolve('/existing/folder'));

      store.addRecentFolder('/existing/folder');

      expect(store.data.lastDirectory).toBe(path.resolve('/existing/folder'));
    });

    it('should not set lastDirectory if the folder does not exist on disk', () => {
      fs.existsSync.mockImplementation((p) => false);
      store.data.lastDirectory = '/previous/dir';

      store.addRecentFolder('/nonexistent/folder');

      expect(store.data.lastDirectory).toBe('/previous/dir');
    });
  });
});
