const chokidar = require('chokidar');
const path = require('path');

class FileWatcherManager {
  constructor(notifyCallback) {
    this.notifyCallback = notifyCallback;
    this.watchers = new Map(); // filePath -> FSWatcher
    this.debounceTimers = new Map();
    this.ignoredPaths = new Set();
  }

  ignoreNext(filePath) {
    if (!filePath) return;
    const resolvedPath = path.resolve(filePath);
    this.ignoredPaths.add(resolvedPath);
    setTimeout(() => {
      this.ignoredPaths.delete(resolvedPath);
    }, 2000);
  }

  watch(filePath) {
    if (!filePath) return;
    const resolvedPath = path.resolve(filePath);
    
    if (this.watchers.has(resolvedPath)) {
      return;
    }

    try {
      const watcher = chokidar.watch(resolvedPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 150,
          pollInterval: 50
        }
      });

      const handleEvent = (event) => {
        if (this.ignoredPaths.has(resolvedPath)) {
          this.ignoredPaths.delete(resolvedPath);
          return;
        }

        if (this.debounceTimers.has(resolvedPath)) {
          clearTimeout(this.debounceTimers.get(resolvedPath));
        }

        const timer = setTimeout(() => {
          this.debounceTimers.delete(resolvedPath);
          if (this.notifyCallback) {
            this.notifyCallback(event, resolvedPath);
          }
        }, 100);

        this.debounceTimers.set(resolvedPath, timer);
      };

      watcher.on('change', () => handleEvent('change'));
      watcher.on('unlink', () => handleEvent('unlink'));
      watcher.on('error', (err) => console.error(`Watcher error for ${resolvedPath}:`, err));

      this.watchers.set(resolvedPath, watcher);
    } catch (err) {
      console.error(`Failed to watch file ${resolvedPath}:`, err);
    }
  }

  unwatch(filePath) {
    if (!filePath) return;
    const resolvedPath = path.resolve(filePath);
    const watcher = this.watchers.get(resolvedPath);
    if (watcher) {
      watcher.close().catch(console.error);
      this.watchers.delete(resolvedPath);
    }
    if (this.debounceTimers.has(resolvedPath)) {
      clearTimeout(this.debounceTimers.get(resolvedPath));
      this.debounceTimers.delete(resolvedPath);
    }
  }

  clear() {
    for (const [filePath, watcher] of this.watchers.entries()) {
      watcher.close().catch(console.error);
    }
    this.watchers.clear();
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}

module.exports = FileWatcherManager;
