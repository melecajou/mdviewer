jest.mock('electron', () => ({
  app: {
    setName: jest.fn(),
    setDesktopName: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn().mockReturnValue({ then: jest.fn() }),
    quit: jest.fn(),
    requestSingleInstanceLock: jest.fn().mockReturnValue(true)
  },
  BrowserWindow: jest.fn(),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {},
  shell: {},
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  },
  nativeImage: {
    createFromPath: jest.fn()
  }
}));

jest.mock('./store', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(),
    getAll: jest.fn().mockReturnValue({}),
    setLastDirectory: jest.fn(),
    set: jest.fn(),
    addRecentFile: jest.fn(),
    addRecentFolder: jest.fn(),
    getLastDirectory: jest.fn()
  }));
});

jest.mock('./file-watcher', () => {
  return jest.fn().mockImplementation(() => ({}));
});

const path = require('path');

describe('main.js addAllowedPath', () => {
  let addAllowedPath;
  let allowedPaths;

  beforeEach(() => {
    jest.resetModules();
    const main = require('./main');
    addAllowedPath = main.addAllowedPath;
    allowedPaths = main.allowedPaths;
    allowedPaths.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should ignore falsy and non-string inputs', () => {
    addAllowedPath(null);
    addAllowedPath(undefined);
    addAllowedPath(123);
    addAllowedPath({});
    expect(allowedPaths.size).toBe(0);
  });

  it('should add a resolved path to allowedPaths', () => {
    const testPath = './test/path';
    addAllowedPath(testPath);
    expect(allowedPaths.has(path.resolve(testPath))).toBe(true);
    expect(allowedPaths.size).toBe(1);
  });

  it('should handle and swallow path.resolve errors', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // We can simulate an error by mocking path.resolve briefly
    const pathResolveMock = jest.spyOn(path, 'resolve').mockImplementation(() => {
      throw new Error('Test resolve error');
    });

    expect(() => addAllowedPath('invalid-path')).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error resolving path to allow:', expect.any(Error));
    expect(allowedPaths.size).toBe(0);

    pathResolveMock.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
