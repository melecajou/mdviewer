const path = require('path');
const chokidar = require('chokidar');
const FileWatcherManager = require('./file-watcher');

jest.mock('chokidar');

describe('FileWatcherManager', () => {
  let watcherManager;
  let mockNotifyCallback;
  let mockChokidarWatcher;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNotifyCallback = jest.fn();
    watcherManager = new FileWatcherManager(mockNotifyCallback);

    mockChokidarWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined)
    };
    chokidar.watch.mockReturnValue(mockChokidarWatcher);

    // Silence console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize properties correctly', () => {
      expect(watcherManager.notifyCallback).toBe(mockNotifyCallback);
      expect(watcherManager.watchers).toBeInstanceOf(Map);
      expect(watcherManager.debounceTimers).toBeInstanceOf(Map);
      expect(watcherManager.ignoredPaths).toBeInstanceOf(Set);
    });
  });

  describe('ignoreNext', () => {
    it('should do nothing if filePath is falsy', () => {
      watcherManager.ignoreNext(null);
      expect(watcherManager.ignoredPaths.size).toBe(0);
    });

    it('should add path to ignoredPaths and remove it after 2000ms', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.ignoreNext(filePath);
      expect(watcherManager.ignoredPaths.has(resolvedPath)).toBe(true);

      jest.advanceTimersByTime(1999);
      expect(watcherManager.ignoredPaths.has(resolvedPath)).toBe(true);

      jest.advanceTimersByTime(1);
      expect(watcherManager.ignoredPaths.has(resolvedPath)).toBe(false);
    });
  });

  describe('watch', () => {
    it('should do nothing if filePath is falsy', () => {
      watcherManager.watch(null);
      expect(chokidar.watch).not.toHaveBeenCalled();
    });

    it('should not watch the same file multiple times', () => {
      const filePath = 'test.md';
      watcherManager.watch(filePath);
      watcherManager.watch(filePath);
      expect(chokidar.watch).toHaveBeenCalledTimes(1);
    });

    it('should setup watcher with correct options', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.watch(filePath);

      expect(chokidar.watch).toHaveBeenCalledWith(resolvedPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 150,
          pollInterval: 50
        }
      });

      expect(mockChokidarWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockChokidarWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
      expect(mockChokidarWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));

      expect(watcherManager.watchers.get(resolvedPath)).toBe(mockChokidarWatcher);
    });

    it('should notify on change event after debounce period', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.watch(filePath);

      const changeHandler = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'change')[1];

      changeHandler();
      expect(mockNotifyCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockNotifyCallback).toHaveBeenCalledWith('change', resolvedPath);
    });

    it('should debounce multiple events', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.watch(filePath);
      const changeHandler = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'change')[1];

      changeHandler(); // t=0
      jest.advanceTimersByTime(50);
      changeHandler(); // t=50 (resets timer)
      jest.advanceTimersByTime(50);

      expect(mockNotifyCallback).not.toHaveBeenCalled(); // total 100ms since first, but 50ms since second

      jest.advanceTimersByTime(50);
      expect(mockNotifyCallback).toHaveBeenCalledTimes(1); // 100ms since second
      expect(mockNotifyCallback).toHaveBeenCalledWith('change', resolvedPath);
    });

    it('should handle unlink events', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.watch(filePath);

      const unlinkHandler = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'unlink')[1];
      unlinkHandler();

      jest.advanceTimersByTime(100);
      expect(mockNotifyCallback).toHaveBeenCalledWith('unlink', resolvedPath);
    });

    it('should ignore events if path is in ignoredPaths', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.watch(filePath);
      watcherManager.ignoreNext(filePath);

      const changeHandler = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
      changeHandler();

      jest.advanceTimersByTime(100);
      expect(mockNotifyCallback).not.toHaveBeenCalled();
      // Should also remove from ignored paths
      expect(watcherManager.ignoredPaths.has(resolvedPath)).toBe(false);
    });

    it('should handle watcher errors', () => {
      const filePath = 'test.md';

      watcherManager.watch(filePath);

      const errorHandler = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'error')[1];
      errorHandler(new Error('test error'));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Watcher error for'),
        expect.any(Error)
      );
    });

    it('should handle chokidar.watch exceptions', () => {
      chokidar.watch.mockImplementationOnce(() => {
        throw new Error('Watch failed');
      });

      const filePath = 'test.md';
      watcherManager.watch(filePath);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to watch file'),
        expect.any(Error)
      );
    });
  });

  describe('unwatch', () => {
    it('should do nothing if filePath is falsy', () => {
      watcherManager.unwatch(null);
      // Ensure no error thrown
    });

    it('should close watcher and clear timers', () => {
      const filePath = 'test.md';
      const resolvedPath = path.resolve(filePath);

      watcherManager.watch(filePath);

      // Simulate pending timer
      const changeHandler = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
      changeHandler();

      expect(watcherManager.watchers.has(resolvedPath)).toBe(true);
      expect(watcherManager.debounceTimers.has(resolvedPath)).toBe(true);

      watcherManager.unwatch(filePath);

      expect(mockChokidarWatcher.close).toHaveBeenCalled();
      expect(watcherManager.watchers.has(resolvedPath)).toBe(false);
      expect(watcherManager.debounceTimers.has(resolvedPath)).toBe(false);

      jest.advanceTimersByTime(100);
      expect(mockNotifyCallback).not.toHaveBeenCalled(); // timer was cleared
    });
  });

  describe('clear', () => {
    it('should close all watchers and clear maps/timers', () => {
      const file1 = 'test1.md';
      const file2 = 'test2.md';

      watcherManager.watch(file1);
      watcherManager.watch(file2);

      const changeHandler1 = mockChokidarWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
      changeHandler1();

      expect(watcherManager.watchers.size).toBe(2);
      expect(watcherManager.debounceTimers.size).toBe(1);

      watcherManager.clear();

      expect(mockChokidarWatcher.close).toHaveBeenCalledTimes(2);
      expect(watcherManager.watchers.size).toBe(0);
      expect(watcherManager.debounceTimers.size).toBe(0);

      jest.advanceTimersByTime(100);
      expect(mockNotifyCallback).not.toHaveBeenCalled(); // timer was cleared
    });
  });
});
