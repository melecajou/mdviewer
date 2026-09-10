const { contextBridge, ipcRenderer } = require('electron');
const { parseMarkdown } = require('./markdown-engine');

contextBridge.exposeInMainWorld('electronAPI', {
  // Markdown Engine
  parseMarkdown: (content, options) => parseMarkdown(content, options),

  // Dialogs
  openFileDialog: (defaultPath) => ipcRenderer.invoke('dialog:open-file', defaultPath),
  openFolderDialog: (defaultPath) => ipcRenderer.invoke('dialog:open-folder', defaultPath),

  // Files
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', { filePath, content }),
  saveFileAs: (content, defaultName, defaultDir) => ipcRenderer.invoke('file:save-as', { content, defaultName, defaultDir }),
  confirmUnsaved: (fileName) => ipcRenderer.invoke('dialog:confirm-unsaved', fileName),
  readDir: (dirPath) => ipcRenderer.invoke('file:read-dir', dirPath),
  watchFile: (filePath) => ipcRenderer.invoke('file:watch', filePath),
  unwatchFile: (filePath) => ipcRenderer.invoke('file:unwatch', filePath),

  // Export
  exportHtml: (payload) => ipcRenderer.invoke('export:html', payload),
  exportPdf: (payload) => ipcRenderer.invoke('export:pdf', payload),

  // Settings
  getSettings: () => ipcRenderer.invoke('store:get-all'),
  saveSettings: (settings) => ipcRenderer.invoke('store:set-all', settings),
  removeRecentFile: (filePath) => ipcRenderer.invoke('store:remove-recent-file', filePath),

  // Shell & Utilities
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-in-folder', filePath),
  getSamplePath: () => ipcRenderer.invoke('app:get-sample-path'),
  getInitialTargets: () => ipcRenderer.invoke('app:get-initial-targets'),

  // Events from Main Process
  onCliOpenTargets: (callback) => {
    ipcRenderer.on('cli:open-targets', (event, targets) => callback(targets));
  },
  onFileChanged: (callback) => {
    ipcRenderer.on('file:changed', (event, data) => callback(data));
  },
  onMenuAction: (action, callback) => {
    ipcRenderer.on(`menu:${action}`, (event, ...args) => callback(...args));
  }
});
