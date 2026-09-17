const path = require('path');

// Mock dependencies before requiring main.js
jest.mock('electron', () => ({
  app: {
    setName: jest.fn(),
    setDesktopName: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn().mockReturnValue(new Promise(() => {})),
    requestSingleInstanceLock: jest.fn().mockReturnValue(true),
    quit: jest.fn(),
    getPath: jest.fn((name) => `/mock/path/${name}`)
  },
  BrowserWindow: jest.fn(),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  dialog: {
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
    showItemInFolder: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn(),
  },
  nativeImage: {
    createFromPath: jest.fn(),
  }
}));

// We also need to mock store and file-watcher to avoid filesystem side effects
jest.mock('./store', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(),
    getAll: jest.fn().mockReturnValue({}),
    setAll: jest.fn(),
    addRecentFile: jest.fn(),
    addRecentFolder: jest.fn(),
    removeRecentFile: jest.fn(),
    setLastDirectory: jest.fn(),
    getLastDirectory: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
  }));
});

jest.mock('./file-watcher', () => {
  return jest.fn().mockImplementation(() => ({
    watch: jest.fn(),
    unwatch: jest.fn(),
    ignoreNext: jest.fn(),
  }));
});

// Since main.js reads command line arguments and checks fs.existsSync,
// we should mock fs lightly so require('./main') doesn't throw.
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn(),
  }
}));

const { isPathAllowed, addAllowedPath, _clearAllowedPaths } = require('./main');

describe('isPathAllowed', () => {
  beforeEach(() => {
    // Clear allowed paths before each test
    _clearAllowedPaths();
    jest.clearAllMocks();
  });

  it('should return false for falsy or non-string inputs', () => {
    expect(isPathAllowed(null)).toBe(false);
    expect(isPathAllowed(undefined)).toBe(false);
    expect(isPathAllowed('')).toBe(false);
    expect(isPathAllowed(123)).toBe(false);
    expect(isPathAllowed({})).toBe(false);
    expect(isPathAllowed([])).toBe(false);
  });

  it('should return true for an exact allowed path', () => {
    const testPath = path.resolve('/test/directory');
    addAllowedPath(testPath);
    expect(isPathAllowed(testPath)).toBe(true);
  });

  it('should return true for a file inside an allowed directory', () => {
    const allowedDir = path.resolve('/test/directory');
    addAllowedPath(allowedDir);

    const fileInside = path.join(allowedDir, 'file.md');
    expect(isPathAllowed(fileInside)).toBe(true);
  });

  it('should return true for a nested file inside an allowed directory', () => {
    const allowedDir = path.resolve('/test/directory');
    addAllowedPath(allowedDir);

    const nestedFile = path.join(allowedDir, 'subdir', 'nested.md');
    expect(isPathAllowed(nestedFile)).toBe(true);
  });

  it('should return false for a path outside of any allowed directory', () => {
    const allowedDir = path.resolve('/test/directory');
    addAllowedPath(allowedDir);

    const outsidePath = path.resolve('/another/directory/file.md');
    expect(isPathAllowed(outsidePath)).toBe(false);
  });

  it('should return false for a path that tries to traverse up and out of the allowed directory', () => {
    const allowedDir = path.resolve('/test/directory');
    addAllowedPath(allowedDir);

    // e.g., /test/directory/../other/file.md -> resolves to /test/other/file.md
    // Since it's outside /test/directory, it should be denied.
    const sneakyPath = path.join(allowedDir, '..', 'other', 'file.md');
    expect(isPathAllowed(sneakyPath)).toBe(false);
  });

  it('should handle multiple allowed paths', () => {
    const allowedDir1 = path.resolve('/test/dir1');
    const allowedDir2 = path.resolve('/test/dir2');

    addAllowedPath(allowedDir1);
    addAllowedPath(allowedDir2);

    expect(isPathAllowed(path.join(allowedDir1, 'file1.md'))).toBe(true);
    expect(isPathAllowed(path.join(allowedDir2, 'file2.md'))).toBe(true);
    expect(isPathAllowed(path.resolve('/test/dir3/file3.md'))).toBe(false);
  });

  it('should handle malicious path resolution failures gracefully', () => {
    // We can simulate path.resolve throwing an error
    const originalResolve = path.resolve;
    path.resolve = jest.fn(() => {
      throw new Error('Simulated path resolution error');
    });

    try {
      expect(isPathAllowed('/test/directory')).toBe(false);
    } finally {
      // Restore path.resolve
      path.resolve = originalResolve;
    }
  });
});
