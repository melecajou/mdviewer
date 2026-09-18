jest.mock('electron', () => ({
  app: {
    setName: jest.fn(),
    setDesktopName: jest.fn(),
    requestSingleInstanceLock: jest.fn(() => true),
    on: jest.fn(),
    whenReady: jest.fn(() => new Promise(() => {})), // Never resolve to prevent createWindow side-effects
    quit: jest.fn(),
    getPath: jest.fn(() => '/mock/path')
  },
  BrowserWindow: jest.fn(),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: jest.fn(),
  shell: jest.fn(),
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  },
  nativeImage: {
    createFromPath: jest.fn()
  }
}));

const fs = require('fs');
const path = require('path');
const { parseCommandLineArgs } = require('./main');

describe('parseCommandLineArgs', () => {
  let originalPlatform;

  beforeAll(() => {
    originalPlatform = process.platform;
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Default existsSync to return false, explicitly mock true for files we want to "exist"
    jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return empty array if argv is not an array', () => {
    expect(parseCommandLineArgs(null)).toEqual([]);
    expect(parseCommandLineArgs(undefined)).toEqual([]);
    expect(parseCommandLineArgs({})).toEqual([]);
    expect(parseCommandLineArgs('string')).toEqual([]);
  });

  it('should ignore null, undefined, and non-string arguments', () => {
    expect(parseCommandLineArgs([null, undefined, 123, {}, []])).toEqual([]);
  });

  it('should ignore flags starting with -', () => {
    expect(parseCommandLineArgs(['-r', '--version', '--ozone-platform=wayland', '-'])).toEqual([]);
  });

  it('should ignore electron and mdviewer binaries', () => {
    const args = [
      '/usr/bin/electron',
      'C:\\Program Files\\MDViewer\\mdviewer.exe',
      '/opt/MDViewer/electron.exe',
      'C:\\path\\electron.exe',
      '/path/mdviewer.exe',
      'electron',
      'mdviewer'
    ];
    expect(parseCommandLineArgs(args)).toEqual([]);
  });

  it('should skip app path and main script path', () => {
    const appPath = path.resolve(__dirname, '../..');
    const mainScriptPath = path.resolve(__dirname, 'main.js');

    fs.existsSync.mockImplementation((p) => p === appPath || p === mainScriptPath);

    expect(parseCommandLineArgs([appPath, mainScriptPath])).toEqual([]);
  });

  it('should resolve and return existing absolute paths', () => {
    const absolutePath = path.resolve('/existing/file.md');
    fs.existsSync.mockImplementation((p) => p === absolutePath);

    expect(parseCommandLineArgs([absolutePath])).toEqual([absolutePath]);
  });

  it('should resolve relative paths against cwd', () => {
    const cwd = '/mock/cwd';
    const relativeArg = 'docs/file.md';
    const expectedPath = path.resolve(cwd, relativeArg);

    fs.existsSync.mockImplementation((p) => p === expectedPath);

    expect(parseCommandLineArgs([relativeArg], cwd)).toEqual([expectedPath]);
  });

  it('should skip paths that do not exist', () => {
    fs.existsSync.mockImplementation(() => false);

    expect(parseCommandLineArgs(['non-existent.md'])).toEqual([]);
  });

  describe('file:// URIs handling', () => {
    it('should decode valid file:// URIs', () => {
      const cwd = '/mock/cwd';
      // Use standard file:// URI
      const fileUri = 'file:///path/to/encoded%20file.md';
      const expectedPath = path.resolve('/path/to/encoded file.md');

      fs.existsSync.mockImplementation((p) => p === expectedPath);

      expect(parseCommandLineArgs([fileUri], cwd)).toEqual([expectedPath]);
    });

    it('should handle Windows specific file:// URIs correctly', () => {
      // Mock platform as win32
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const cwd = 'C:\\mock\\cwd';
      const fileUri = 'file:///C:/Users/Test/file.md';

      // On win32, the code strips the leading slash so arg becomes "C:/Users/Test/file.md"
      // Since this test runs in a POSIX environment natively, path.resolve treats it as relative
      const argAfterReplace = 'C:/Users/Test/file.md';
      const expectedPath = path.isAbsolute(argAfterReplace)
        ? path.resolve(argAfterReplace)
        : path.resolve(cwd, argAfterReplace);

      fs.existsSync.mockImplementation((p) => p === expectedPath);

      expect(parseCommandLineArgs([fileUri], cwd)).toEqual([expectedPath]);
    });

    it('should gracefully handle malformed file:// URIs using regex fallback', () => {
      // Create a malformed URL that fails `new URL(arg)`
      // In Node.js, things like `file://%` might throw URIError on decodeURIComponent,
      // but new URL('file://malformed') might just work.
      // Let's force an error by mocking URL constructor globally temporarily or providing an invalid URL structure.

      // new URL('file://') actually works but throws if it's completely busted, but we can also mock it.
      const originalURL = global.URL;
      global.URL = jest.fn(() => { throw new Error('Invalid URL'); });

      const cwd = '/mock/cwd';
      const fileUri = 'file:///path/to/file.md';
      const expectedPath = path.resolve('/path/to/file.md');

      fs.existsSync.mockImplementation((p) => p === expectedPath);

      expect(parseCommandLineArgs([fileUri], cwd)).toEqual([expectedPath]);

      global.URL = originalURL;
    });
  });

  it('should catch exceptions during checking and log them', () => {
    fs.existsSync.mockImplementation(() => {
      throw new Error('Access denied');
    });

    const cwd = '/mock/cwd';
    const args = ['some-file.md'];

    const result = parseCommandLineArgs(args, cwd);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Error checking arg path:', expect.any(Error));
  });
});
