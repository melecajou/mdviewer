let exposedApi = null;
const mockExposeInMainWorld = jest.fn((apiKey, apiObject) => {
  if (apiKey === 'electronAPI') {
    exposedApi = apiObject;
  }
});

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (...args) => mockExposeInMainWorld(...args)
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn()
  }
}));

jest.mock('./markdown-engine', () => ({
  parseMarkdown: jest.fn()
}));

const { ipcRenderer } = require('electron');
const { parseMarkdown } = require('./markdown-engine');

require('./preload');

describe('preload.js API bridge', () => {
  beforeEach(() => {
    ipcRenderer.invoke.mockClear();
    ipcRenderer.on.mockClear();
    parseMarkdown.mockClear();
  });

  test('should expose electronAPI to main world via contextBridge', () => {
    expect(mockExposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object));
    expect(exposedApi).not.toBeNull();
  });

  describe('Markdown Engine API', () => {
    test('parseMarkdown should delegate to markdown-engine parseMarkdown', () => {
      parseMarkdown.mockReturnValue({ html: '<p>test</p>', headings: [], stats: {} });
      const result = exposedApi.parseMarkdown('# Test');

      expect(parseMarkdown).toHaveBeenCalledWith('# Test');
      expect(result).toEqual({ html: '<p>test</p>', headings: [], stats: {} });
    });
  });

  describe('Dialogs APIs', () => {
    test('openFileDialog should invoke dialog:open-file with defaultPath', () => {
      ipcRenderer.invoke.mockResolvedValue('/path/to/file.md');
      exposedApi.openFileDialog('/default/path');

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('dialog:open-file', '/default/path');
    });

    test('openFolderDialog should invoke dialog:open-folder with defaultPath', () => {
      ipcRenderer.invoke.mockResolvedValue('/path/to/folder');
      exposedApi.openFolderDialog('/default/folder');

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('dialog:open-folder', '/default/folder');
    });
  });

  describe('Files APIs', () => {
    test('readFile should invoke file:read with filePath', () => {
      exposedApi.readFile('/path/to/file.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('file:read', '/path/to/file.md');
    });

    test('saveFile should invoke file:save with filePath and content object payload', () => {
      exposedApi.saveFile('/path/to/file.md', '# Content');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('file:save', {
        filePath: '/path/to/file.md',
        content: '# Content'
      });
    });

    test('saveFileAs should invoke file:save-as with payload', () => {
      exposedApi.saveFileAs('# Content', 'doc.md', '/dir');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('file:save-as', {
        content: '# Content',
        defaultName: 'doc.md',
        defaultDir: '/dir'
      });
    });

    test('confirmUnsaved should invoke dialog:confirm-unsaved with fileName', () => {
      exposedApi.confirmUnsaved('doc.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('dialog:confirm-unsaved', 'doc.md');
    });

    test('readDir should invoke file:read-dir with dirPath', () => {
      exposedApi.readDir('/path/to/dir');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('file:read-dir', '/path/to/dir');
    });

    test('watchFile should invoke file:watch with filePath', () => {
      exposedApi.watchFile('/path/to/file.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('file:watch', '/path/to/file.md');
    });

    test('unwatchFile should invoke file:unwatch with filePath', () => {
      exposedApi.unwatchFile('/path/to/file.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('file:unwatch', '/path/to/file.md');
    });
  });

  describe('Export APIs', () => {
    test('exportHtml should invoke export:html with payload', () => {
      const payload = { html: '<p>test</p>', title: 'Test' };
      exposedApi.exportHtml(payload);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('export:html', payload);
    });

    test('exportPdf should invoke export:pdf with payload', () => {
      const payload = { html: '<p>test</p>' };
      exposedApi.exportPdf(payload);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('export:pdf', payload);
    });
  });

  describe('Settings APIs', () => {
    test('getSettings should invoke store:get-all', () => {
      exposedApi.getSettings();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:get-all');
    });

    test('saveSettings should invoke store:set-all with settings', () => {
      const settings = { theme: 'dark' };
      exposedApi.saveSettings(settings);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:set-all', settings);
    });

    test('removeRecentFile should invoke store:remove-recent-file with filePath', () => {
      exposedApi.removeRecentFile('/path/to/file.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:remove-recent-file', '/path/to/file.md');
    });
  });

  describe('Shell & Utilities APIs', () => {
    test('openExternal should invoke shell:open-external with url', () => {
      exposedApi.openExternal('https://example.com');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('shell:open-external', 'https://example.com');
    });

    test('showInFolder should invoke shell:show-in-folder with filePath', () => {
      exposedApi.showInFolder('/path/to/file.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('shell:show-in-folder', '/path/to/file.md');
    });

    test('getSamplePath should invoke app:get-sample-path', () => {
      exposedApi.getSamplePath();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app:get-sample-path');
    });

    test('getInitialTargets should invoke app:get-initial-targets', () => {
      exposedApi.getInitialTargets();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app:get-initial-targets');
    });

    test('allowDroppedPath should invoke app:allow-dropped-path with filePath', () => {
      exposedApi.allowDroppedPath('/path/to/file.md');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app:allow-dropped-path', '/path/to/file.md');
    });
  });

  describe('Event Listener APIs', () => {
    test('onCliOpenTargets should register IPC listener on cli:open-targets and invoke callback when triggered', () => {
      const callback = jest.fn();
      exposedApi.onCliOpenTargets(callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('cli:open-targets', expect.any(Function));

      const registeredListener = ipcRenderer.on.mock.calls.find(call => call[0] === 'cli:open-targets')[1];
      const mockEvent = {};
      const mockTargets = ['/path/1.md', '/path/2.md'];
      registeredListener(mockEvent, mockTargets);

      expect(callback).toHaveBeenCalledWith(mockTargets);
    });

    test('onFileChanged should register IPC listener on file:changed and invoke callback when triggered', () => {
      const callback = jest.fn();
      exposedApi.onFileChanged(callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('file:changed', expect.any(Function));

      const registeredListener = ipcRenderer.on.mock.calls.find(call => call[0] === 'file:changed')[1];
      const mockEvent = {};
      const mockData = { filePath: '/path/file.md', content: 'new content' };
      registeredListener(mockEvent, mockData);

      expect(callback).toHaveBeenCalledWith(mockData);
    });

    test('onMenuAction should register IPC listener on menu:<action> and invoke callback with args when triggered', () => {
      const callback = jest.fn();
      exposedApi.onMenuAction('open', callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('menu:open', expect.any(Function));

      const registeredListener = ipcRenderer.on.mock.calls.find(call => call[0] === 'menu:open')[1];
      const mockEvent = {};
      registeredListener(mockEvent, 'arg1', 'arg2');

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
