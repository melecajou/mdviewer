const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class Store {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.filePath = path.join(this.userDataPath, 'mdviewer-settings.json');
    this.defaults = {
      theme: 'github-dark',
      fontSize: 16,
      zoomLevel: 1.0,
      recentFiles: [],
      recentFolders: [],
      lastOpenedFolder: null,
      lastDirectory: null,
      sidebarVisible: true,
      sidebarTab: 'explorer', // 'explorer' | 'toc' | 'recent'
      viewMode: 'preview', // 'preview' | 'source' | 'split'
      liveWatch: true,
      lineNumbers: true,
      windowBounds: { width: 1200, height: 800, x: undefined, y: undefined }
    };
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        return { ...this.defaults, ...JSON.parse(content) };
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
    return { ...this.defaults };
  }

  async save() {
    if (this._isSaving) {
      this._saveQueued = true;
      return;
    }
    this._isSaving = true;
    this._saveQueued = false;
    try {
      await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      this._isSaving = false;
      if (this._saveQueued) {
        this.save();
      }
    }
  }

  get(key) {
    return this.data[key] !== undefined ? this.data[key] : this.defaults[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  getAll() {
    return { ...this.data };
  }

  setAll(newSettings) {
    this.data = { ...this.data, ...newSettings };
    this.save();
  }

  setLastDirectory(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') return;
    try {
      const resolved = path.resolve(dirPath);
      if (fs.existsSync(resolved)) {
        const isDir = fs.statSync(resolved).isDirectory();
        this.data.lastDirectory = isDir ? resolved : path.dirname(resolved);
        this.save();
      }
    } catch (e) {
      console.error('Error setting last directory:', e);
    }
  }

  getLastDirectory(preferredPath = null) {
    const isValidDir = (dir) => {
      if (!dir || typeof dir !== 'string') return false;
      try {
        if (fs.existsSync(dir)) {
          return fs.statSync(dir).isDirectory();
        }
      } catch {}
      return false;
    };

    // 1. Preferred path passed explicitly
    if (isValidDir(preferredPath)) {
      return preferredPath;
    }
    if (preferredPath && typeof preferredPath === 'string') {
      try {
        const parent = path.dirname(preferredPath);
        if (isValidDir(parent)) return parent;
      } catch {}
    }

    // 2. Stored lastDirectory
    if (isValidDir(this.data.lastDirectory)) {
      return this.data.lastDirectory;
    }

    // 3. Stored lastOpenedFolder
    if (isValidDir(this.data.lastOpenedFolder)) {
      return this.data.lastOpenedFolder;
    }

    // 4. Most recent files' directories
    const recents = this.data.recentFiles || [];
    for (const f of recents) {
      try {
        const dir = path.dirname(f);
        if (isValidDir(dir)) return dir;
      } catch {}
    }

    // 5. Most recent folders
    const recentFolders = this.data.recentFolders || [];
    for (const f of recentFolders) {
      if (isValidDir(f)) return f;
    }

    // 6. Documents or Home folder
    try {
      const docs = app.getPath('documents');
      if (isValidDir(docs)) return docs;
    } catch {}

    try {
      const home = app.getPath('home');
      if (isValidDir(home)) return home;
    } catch {}

    return undefined;
  }

  addRecentFile(filePath) {
    if (!filePath || typeof filePath !== 'string') return;
    const norm = path.resolve(filePath);
    let recents = (this.data.recentFiles || []).filter(p => p !== norm);
    recents.unshift(norm);
    if (recents.length > 20) {
      recents = recents.slice(0, 20);
    }
    this.data.recentFiles = recents;
    const dir = path.dirname(norm);
    if (fs.existsSync(dir)) {
      this.data.lastDirectory = dir;
    }
    this.save();
  }

  addRecentFolder(folderPath) {
    if (!folderPath || typeof folderPath !== 'string') return;
    const norm = path.resolve(folderPath);
    let recents = (this.data.recentFolders || []).filter(p => p !== norm);
    recents.unshift(norm);
    if (recents.length > 10) {
      recents = recents.slice(0, 10);
    }
    this.data.recentFolders = recents;
    if (fs.existsSync(norm)) {
      this.data.lastDirectory = norm;
    }
    this.save();
  }

  removeRecentFile(filePath) {
    const norm = path.resolve(filePath);
    this.data.recentFiles = (this.data.recentFiles || []).filter(p => p !== norm);
    this.save();
  }
}

module.exports = Store;
