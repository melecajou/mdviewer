/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const DOMPurify = require('dompurify');

// Mock Element.prototype.scrollIntoView for jsdom environment
Element.prototype.scrollIntoView = jest.fn();

// Mock chrome API for extension environment
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue({})
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn(path => path)
  }
};

// Load MDViewerBase
global.MDViewerBase = require('../../shared/js/MDViewerBase');

describe('Extension Viewer Sanitization', () => {
  let app;
  const MDViewerExtensionApp = require('./viewer');

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="btn-toggle-sidebar"></div>
      <div id="btn-new-file"></div>
      <div id="btn-open-file"></div>
      <div id="btn-save-file"></div>
      <div id="btn-open-folder"></div>
      <div id="btn-reload"></div>
      <div id="btn-view-preview"></div>
      <div id="btn-view-split"></div>
      <div id="btn-view-source"></div>
      <div id="btn-find"></div>
      <div id="watch-status"></div>
      <div id="btn-zoom-out"></div>
      <div id="btn-zoom-reset"></div>
      <div id="btn-zoom-in"></div>
      <div id="zoom-level-text"></div>
      <select id="theme-selector"></select>
      <div id="export-dropdown"></div>
      <div id="btn-export-toggle"></div>
      <div id="menu-export-pdf"></div>
      <div id="menu-export-html"></div>
      <div id="editor-toolbar"></div>
      <div id="btn-fmt-bold"></div>
      <div id="btn-fmt-italic"></div>
      <div id="btn-fmt-strike"></div>
      <div id="btn-fmt-heading"></div>
      <div id="btn-fmt-quote"></div>
      <div id="btn-fmt-code"></div>
      <div id="btn-fmt-codeblock"></div>
      <div id="btn-fmt-ul"></div>
      <div id="btn-fmt-ol"></div>
      <div id="btn-fmt-task"></div>
      <div id="btn-fmt-link"></div>
      <div id="btn-fmt-image"></div>
      <div id="btn-fmt-table"></div>
      <input id="hidden-file-input" type="file" />
      <input id="hidden-folder-input" type="file" />
      <div id="app-sidebar"></div>
      <div id="explorer-folder-name"></div>
      <div id="btn-sidebar-open-folder"></div>
      <input id="explorer-search" />
      <div id="file-tree-container"></div>
      <div id="toc-container"></div>
      <ul id="recent-files-list"></ul>
      <div id="app-content-wrapper"></div>
      <div id="tabs-bar"><button id="btn-tab-add"></button></div>
      <div id="viewport-container"></div>
      <div id="welcome-screen"></div>
      <div id="welcome-dropzone"></div>
      <div id="btn-welcome-open-file"></div>
      <div id="btn-welcome-sample"></div>
      <div id="source-pane"></div>
      <textarea id="source-textarea"></textarea>
      <div id="preview-pane"></div>
      <div id="markdown-container"></div>
      <div id="find-bar"></div>
      <input id="find-input" />
      <span id="find-count"></span>
      <button id="find-prev"></button>
      <button id="find-next"></button>
      <button id="find-close"></button>
      <span id="status-filepath"></span>
      <span id="status-stats"></span>
      <span id="status-read-time"></span>
      <div id="shortcuts-modal"></div>
      <button id="btn-close-shortcuts"></button>
      <div id="lightbox-modal"></div>
      <img id="lightbox-img" />
      <button id="lightbox-close"></button>
    `;

    window.MDViewerEngine = {
      parseMarkdown: (text) => ({
        html: text,
        headings: [],
        stats: { words: 10, lines: 1, readTimeMinutes: 1 }
      })
    };

    window.DOMPurify = DOMPurify;
    app = new MDViewerExtensionApp();
  });

  afterEach(() => {
    delete window.DOMPurify;
    delete global.DOMPurify;
  });

  it('should sanitize HTML output and strip dangerous XSS scripts', () => {
    const maliciousHtml = '<h1>Title</h1><script>alert("XSS")</script><img src="x" onerror="alert(1)">';
    app.renderMarkdown(maliciousHtml);

    const container = document.getElementById('markdown-container');
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).not.toContain('onerror');
    expect(container.innerHTML).toContain('<h1>Title</h1>');
  });

  it('should throw an error when DOMPurify is not available', () => {
    delete window.DOMPurify;
    delete global.DOMPurify;

    expect(() => {
      app.renderMarkdown('<h1>Title</h1>');
    }).toThrow('DOMPurify library is required for rendering markdown content securely.');
  });
});

// Load extension script using Function evaluator
const extensionScript = fs.readFileSync(path.resolve(__dirname, './viewer.js'), 'utf8');

describe('MDViewerExtensionApp Search (performFind) Security', () => {
  let app;
  let markdownContainer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="btn-toggle-sidebar"></div>
      <div id="btn-new-file"></div>
      <div id="btn-open-file"></div>
      <div id="btn-save-file"></div>
      <div id="btn-open-folder"></div>
      <div id="btn-reload"></div>
      <div id="btn-view-preview"></div>
      <div id="btn-view-split"></div>
      <div id="btn-view-source"></div>
      <div id="btn-find"></div>
      <div id="watch-status"></div>
      <div id="btn-zoom-out"></div>
      <div id="btn-zoom-reset"></div>
      <div id="btn-zoom-in"></div>
      <div id="zoom-level-text"></div>
      <select id="theme-selector"></select>
      <div id="export-dropdown"></div>
      <div id="btn-export-toggle"></div>
      <div id="menu-export-pdf"></div>
      <div id="menu-export-html"></div>
      <div id="editor-toolbar"></div>
      <div id="btn-fmt-bold"></div>
      <div id="btn-fmt-italic"></div>
      <div id="btn-fmt-strike"></div>
      <div id="btn-fmt-heading"></div>
      <div id="btn-fmt-quote"></div>
      <div id="btn-fmt-code"></div>
      <div id="btn-fmt-codeblock"></div>
      <div id="btn-fmt-ul"></div>
      <div id="btn-fmt-ol"></div>
      <div id="btn-fmt-task"></div>
      <div id="btn-fmt-link"></div>
      <div id="btn-fmt-image"></div>
      <div id="btn-fmt-table"></div>
      <input id="hidden-file-input" type="file" />
      <input id="hidden-folder-input" type="file" />
      <div id="app-sidebar"></div>
      <div id="explorer-folder-name"></div>
      <div id="btn-sidebar-open-folder"></div>
      <input id="explorer-search" />
      <div id="file-tree-container"></div>
      <div id="toc-container"></div>
      <ul id="recent-files-list"></ul>
      <div id="app-content-wrapper"></div>
      <div id="tabs-bar"><button id="btn-tab-add"></button></div>
      <div id="viewport-container"></div>
      <div id="welcome-screen"></div>
      <div id="welcome-dropzone"></div>
      <div id="btn-welcome-open-file"></div>
      <div id="btn-welcome-sample"></div>
      <div id="source-pane"></div>
      <textarea id="source-textarea"></textarea>
      <div id="preview-pane"></div>
      <div id="markdown-container"></div>
      <div id="find-bar"></div>
      <input id="find-input" />
      <span id="find-count"></span>
      <button id="find-prev"></button>
      <button id="find-next"></button>
      <button id="find-close"></button>
      <span id="status-filepath"></span>
      <span id="status-stats"></span>
      <span id="status-read-time"></span>
      <div id="shortcuts-modal"></div>
      <button id="btn-close-shortcuts"></button>
      <div id="lightbox-modal"></div>
      <img id="lightbox-img" />
      <button id="lightbox-close"></button>
    `;

    const createClass = new Function('MDViewerBase', `${extensionScript}; return MDViewerExtensionApp;`);
    const MDViewerExtensionApp = createClass(global.MDViewerBase);
    app = new MDViewerExtensionApp();
    markdownContainer = document.getElementById('markdown-container');
  });

  it('should highlight matches safely without executing XSS payload in document text', () => {
    // Document text contains malicious script tags
    const p = document.createElement('p');
    p.textContent = 'Hello <img src=x onerror=alert(1)> match test!';
    markdownContainer.appendChild(p);

    app.performFind('match');

    // Matches should be found
    expect(app.findMatches.length).toBe(1);
    expect(app.findMatches[0].textContent).toBe('match');

    // The container innerHTML must NOT contain executable onerror handler or html tags from text content
    expect(markdownContainer.innerHTML).not.toContain('<img src=x');
    expect(markdownContainer.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(markdownContainer.querySelector('img')).toBeNull();
  });

  it('should highlight matches safely when search query match contains special HTML characters', () => {
    const p = document.createElement('p');
    p.textContent = 'Comparing 5 < 10 and 10 > 5 values';
    markdownContainer.appendChild(p);

    app.performFind('< 10');

    expect(app.findMatches.length).toBe(1);
    expect(app.findMatches[0].textContent).toBe('< 10');
    expect(markdownContainer.querySelector('script')).toBeNull();
  });
});

const MDViewerBase = require('../../shared/js/MDViewerBase');
global.MDViewerBase = MDViewerBase;

const MDViewerExtensionApp = require('./viewer');

describe('MDViewerExtensionApp - Find in Page', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="markdown-container"></div>
      <span id="find-count"></span>
    `;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    app = Object.create(MDViewerExtensionApp.prototype);
    app.markdownContainer = document.getElementById('markdown-container');
    app.findCount = document.getElementById('find-count');
    app.findMatches = [];
    app.currentFindIndex = -1;
  });

  it('should find matches across text nodes and highlight them', () => {
    app.markdownContainer.innerHTML = '<p>Hello world! Hello JavaScript. Search test.</p>';
    app.performFind('hello');

    expect(app.findMatches.length).toBe(2);
    expect(app.currentFindIndex).toBe(0);
    expect(app.findCount.textContent).toBe('1 / 2');

    const marks = app.markdownContainer.querySelectorAll('.find-match');
    expect(marks.length).toBe(2);
    expect(marks[0].classList.contains('current')).toBe(true);
    expect(marks[1].classList.contains('current')).toBe(false);
  });

  it('should navigate matches using findNext and findPrevious', () => {
    app.markdownContainer.innerHTML = '<p>One test, two test, three test.</p>';
    app.performFind('test');

    expect(app.findMatches.length).toBe(3);
    expect(app.currentFindIndex).toBe(0);

    app.findNext();
    expect(app.currentFindIndex).toBe(1);
    expect(app.findCount.textContent).toBe('2 / 3');

    app.findNext();
    expect(app.currentFindIndex).toBe(2);
    expect(app.findCount.textContent).toBe('3 / 3');

    app.findNext();
    expect(app.currentFindIndex).toBe(0);
    expect(app.findCount.textContent).toBe('1 / 3');

    app.findPrevious();
    expect(app.currentFindIndex).toBe(2);
    expect(app.findCount.textContent).toBe('3 / 3');
  });

  it('should clear find highlights correctly', () => {
    app.markdownContainer.innerHTML = '<p>Clear test one and clear test two.</p>';
    app.performFind('test');

    expect(app.findMatches.length).toBe(2);

    app.clearFindHighlights();
    expect(app.findMatches.length).toBe(0);
    expect(app.currentFindIndex).toBe(-1);
    expect(app.markdownContainer.querySelectorAll('.find-match').length).toBe(0);
    expect(app.markdownContainer.textContent).toBe('Clear test one and clear test two.');
  });

  it('should handle queries shorter than 2 characters gracefully', () => {
    app.markdownContainer.innerHTML = '<p>Short query test</p>';
    app.performFind('a');

    expect(app.findMatches.length).toBe(0);
    expect(app.findCount.textContent).toBe('0 / 0');
  });

  it('should handle query with special regex characters safely', () => {
    app.markdownContainer.innerHTML = '<p>Special [test] and (test) and *test*.</p>';
    app.performFind('[test]');

    expect(app.findMatches.length).toBe(1);
    expect(app.findMatches[0].textContent).toBe('[test]');
  });

  it('should preserve text with HTML special characters safely', () => {
    app.markdownContainer.innerHTML = '<p>Text with &lt;script&gt; tag and &amp; symbol.</p>';
    app.performFind('script');

    expect(app.findMatches.length).toBe(1);
    expect(app.markdownContainer.textContent).toBe('Text with <script> tag and & symbol.');
  });
});

describe('MDViewerExtensionApp', () => {
  let MDViewerExtensionApp;
  let app;
  let onMessageListener;

  function createDOM() {
    document.body.innerHTML = `
      <button id="btn-toggle-sidebar"></button>
      <button id="btn-new-file"></button>
      <button id="btn-open-file"></button>
      <button id="btn-save-file"><span>Salvar</span></button>
      <button id="btn-open-folder"></button>
      <button id="btn-reload"></button>
      <button id="btn-view-preview"></button>
      <button id="btn-view-split"></button>
      <button id="btn-view-source"></button>
      <button id="btn-find"></button>
      <div id="watch-status"></div>
      <button id="btn-zoom-out"></button>
      <button id="btn-zoom-reset"></button>
      <button id="btn-zoom-in"></button>
      <span id="zoom-level-text">100%</span>
      <select id="theme-selector">
        <option value="github-dark">github-dark</option>
        <option value="github-light">github-light</option>
      </select>
      <div id="export-dropdown"></div>
      <button id="btn-export-toggle"></button>
      <button id="menu-export-pdf"></button>
      <button id="menu-export-html"></button>

      <div id="editor-toolbar"></div>
      <button id="btn-fmt-bold"></button>
      <button id="btn-fmt-italic"></button>
      <button id="btn-fmt-strike"></button>
      <button id="btn-fmt-heading"></button>
      <button id="btn-fmt-quote"></button>
      <button id="btn-fmt-code"></button>
      <button id="btn-fmt-codeblock"></button>
      <button id="btn-fmt-ul"></button>
      <button id="btn-fmt-ol"></button>
      <button id="btn-fmt-task"></button>
      <button id="btn-fmt-link"></button>
      <button id="btn-fmt-image"></button>
      <button id="btn-fmt-table"></button>

      <input type="file" id="hidden-file-input" />
      <input type="file" id="hidden-folder-input" />

      <div id="app-sidebar">
        <button class="sidebar-tab-btn active" data-tab="explorer"></button>
        <button class="sidebar-tab-btn" data-tab="toc"></button>
        <div class="sidebar-pane active" id="pane-explorer"></div>
        <div class="sidebar-pane" id="pane-toc"></div>
        <span id="explorer-folder-name"></span>
        <button id="btn-sidebar-open-folder"></button>
        <input type="text" id="explorer-search" />
        <div id="file-tree-container"></div>
        <div id="toc-container"></div>
        <ul id="recent-files-list"></ul>
      </div>

      <div id="app-content-wrapper">
        <div id="tabs-bar">
          <button id="btn-tab-add"></button>
        </div>
        <div id="viewport-container">
          <div id="welcome-screen">
            <div id="welcome-dropzone"></div>
            <button id="btn-welcome-open-file"></button>
            <button id="btn-welcome-sample"></button>
          </div>
          <div id="source-pane">
            <textarea id="source-textarea"></textarea>
          </div>
          <div id="preview-pane">
            <div id="markdown-container"></div>
          </div>
        </div>
      </div>

      <div id="find-bar">
        <input type="text" id="find-input" />
        <span id="find-count">0 / 0</span>
        <button id="find-prev"></button>
        <button id="find-next"></button>
        <button id="find-close"></button>
      </div>

      <div id="status-bar">
        <span id="status-filepath">Nenhum arquivo</span>
        <span id="status-stats">0 palavras • 0 linhas</span>
        <span id="status-read-time">1 min de leitura</span>
      </div>

      <div id="shortcuts-modal">
        <button id="btn-close-shortcuts"></button>
      </div>
      <div id="lightbox-modal">
        <img id="lightbox-img" src="" />
        <button id="lightbox-close"></button>
      </div>
    `;
  }

  beforeEach(() => {
    createDOM();

    onMessageListener = null;

    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn().mockImplementation((keys) => {
            return Promise.resolve({
              theme: 'github-dark',
              zoomLevel: 1.0,
              viewMode: 'preview',
              sidebarVisible: true,
              sidebarTab: 'explorer',
              recentFiles: []
            });
          }),
          set: jest.fn().mockImplementation(() => Promise.resolve())
        }
      },
      runtime: {
        onMessage: {
          addListener: jest.fn().mockImplementation((fn) => {
            onMessageListener = fn;
          })
        },
        getURL: jest.fn().mockImplementation((path) => `chrome-extension://mock-id/${path}`)
      }
    };

    window.MDViewerEngine = {
      parseMarkdown: jest.fn().mockImplementation((content) => ({
        html: `<h1>Test Header</h1><p>${content}</p>`,
        headings: [{ id: 'test-header', level: 1, text: 'Test Header' }],
        stats: { words: 10, lines: 2, readTimeMinutes: 1 }
      }))
    };

    window.DOMPurify = {
      sanitize: jest.fn().mockImplementation((html) => html)
    };

    window.mermaid = {
      initialize: jest.fn(),
      run: jest.fn()
    };

    window.print = jest.fn();

    // Mock document.execCommand
    document.execCommand = jest.fn();
    document.queryCommandSupported = jest.fn().mockReturnValue(true);

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve())
      },
      writable: true,
      configurable: true
    });

    MDViewerExtensionApp = require('./viewer');
    app = new MDViewerExtensionApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization & Settings', () => {
    it('should initialize elements and load settings', async () => {
      await app.loadSettings();
      expect(chrome.storage.local.get).toHaveBeenCalledWith([
        'theme', 'zoomLevel', 'viewMode', 'sidebarVisible', 'sidebarTab', 'recentFiles'
      ]);
      expect(document.documentElement.getAttribute('data-theme')).toBe('github-dark');
    });

    it('should handle loadSettings with custom stored values', async () => {
      chrome.storage.local.get.mockResolvedValueOnce({
        theme: 'github-light',
        zoomLevel: 1.2,
        viewMode: 'split',
        sidebarVisible: false,
        sidebarTab: 'toc',
        recentFiles: [{ title: 'Doc.md', path: 'Doc.md', date: 12345 }]
      });

      await app.loadSettings();
      expect(document.documentElement.getAttribute('data-theme')).toBe('github-light');
      expect(app.zoomLevel).toBe(1.2);
      expect(app.viewMode).toBe('split');
      expect(app.isSidebarCollapsed).toBe(true);
    });

    it('should handle loadSettings errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValueOnce(new Error('Storage error'));
      await expect(app.loadSettings()).resolves.not.toThrow();
    });

    it('should save settings to chrome.storage.local', () => {
      app.saveSettings();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should handle setupRuntimeListeners on message event', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(onMessageListener).toBeDefined();

      onMessageListener({
        action: 'loadInitialDoc',
        filename: 'Initial.md',
        content: '# Hello',
        url: 'Initial.md'
      });

      expect(app.tabs.length).toBe(1);
      expect(app.tabs[0].title).toBe('Initial.md');
      expect(app.tabs[0].content).toBe('# Hello');
    });
  });

  describe('Tab Management', () => {
    it('should open a new document tab', () => {
      app.openDocumentTab('Doc1.md', '# Content', 'Doc1.md');
      expect(app.tabs.length).toBe(1);
      expect(app.tabs[0].title).toBe('Doc1.md');
      expect(app.activeTabId).toBe(app.tabs[0].id);
    });

    it('should activate existing tab if path matches', () => {
      app.openDocumentTab('Doc1.md', '# Content', 'Doc1.md');
      const firstTabId = app.tabs[0].id;

      app.openDocumentTab('Doc2.md', '# Content 2', 'Doc2.md');
      expect(app.tabs.length).toBe(2);

      app.openDocumentTab('Doc1.md', '# Content modified', 'Doc1.md');
      expect(app.tabs.length).toBe(2);
      expect(app.activeTabId).toBe(firstTabId);
    });

    it('should close a tab when user confirms or if clean', () => {
      app.openDocumentTab('Doc1.md', 'Content', 'Doc1.md');
      const tabId = app.tabs[0].id;

      app.closeTab(tabId);
      expect(app.tabs.length).toBe(0);
      expect(app.activeTabId).toBeNull();
    });

    it('should prompt before closing dirty tab', () => {
      window.confirm = jest.fn().mockReturnValue(false);
      app.openDocumentTab('Doc1.md', 'Content', 'Doc1.md');
      const tab = app.getActiveTab();
      app.updateTabDirty(tab, true);

      app.closeTab(tab.id);
      expect(window.confirm).toHaveBeenCalled();
      expect(app.tabs.length).toBe(1);

      window.confirm.mockReturnValue(true);
      app.closeTab(tab.id);
      expect(app.tabs.length).toBe(0);
    });

    it('should reload active tab content if clean and has file handle', async () => {
      const mockFile = { text: jest.fn().mockResolvedValue('# Reloaded Content') };
      const mockHandle = { getFile: jest.fn().mockResolvedValue(mockFile) };

      app.openDocumentTab('Doc1.md', '# Content', 'Doc1.md', mockHandle);
      await app.reloadActiveTab();

      expect(mockHandle.getFile).toHaveBeenCalled();
      expect(app.getActiveTab().content).toBe('# Reloaded Content');
    });
  });

  describe('Editor & File Handlers', () => {
    it('should handle new file creation', () => {
      app.handleNewFile();
      expect(app.tabs.length).toBe(1);
      expect(app.getActiveTab().title).toBe('Sem Título.md');
      expect(app.getActiveTab().isDirty).toBe(true);
    });

    it('should handle editor input change and debounce markdown render', (done) => {
      app.openDocumentTab('Doc.md', 'Initial', 'Doc.md');
      app.sourceTextarea.value = 'New Content';

      app.handleEditorInput();
      expect(app.getActiveTab().content).toBe('New Content');
      expect(app.getActiveTab().isDirty).toBe(true);

      setTimeout(() => {
        expect(window.MDViewerEngine.parseMarkdown).toHaveBeenCalledWith('New Content');
        done();
      }, 200);
    });

    it('should toggle task checkbox in markdown content', () => {
      app.openDocumentTab('Doc.md', '- [ ] Task 1\n- [ ] Task 2', 'Doc.md');
      app.toggleTaskCheckbox(1, true);

      expect(app.getActiveTab().content).toBe('- [ ] Task 1\n- [x] Task 2');
    });

    it('should handle save file with file handle', async () => {
      const createWritable = jest.fn().mockResolvedValue({
        write: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue()
      });
      const mockHandle = { createWritable, name: 'Doc1.md' };

      app.openDocumentTab('Doc1.md', 'Content', 'Doc1.md', mockHandle);
      const activeTab = app.getActiveTab();
      activeTab.isDirty = true;

      const result = await app.handleSaveFile();
      expect(result).toBe(true);
      expect(activeTab.isDirty).toBe(false);
    });

    it('should handle save file with showSaveFilePicker', async () => {
      const createWritable = jest.fn().mockResolvedValue({
        write: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue()
      });
      const mockHandle = { createWritable, name: 'Saved.md' };
      window.showSaveFilePicker = jest.fn().mockResolvedValue(mockHandle);

      app.openDocumentTab('Doc1.md', 'Content', 'Doc1.md', null);
      const result = await app.handleSaveFile();

      expect(window.showSaveFilePicker).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(app.getActiveTab().title).toBe('Saved.md');
    });

    it('should handle save file fallback (Blob download) when showSaveFilePicker is not present', async () => {
      delete window.showSaveFilePicker;
      URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      URL.revokeObjectURL = jest.fn();

      app.openDocumentTab('Doc1.md', 'Content', 'Doc1.md', null);
      const result = await app.handleSaveFile();

      expect(result).toBe(true);
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should open file using showOpenFilePicker', async () => {
      const mockFile = { name: 'Picked.md', text: jest.fn().mockResolvedValue('# Picked File') };
      const mockHandle = { getFile: jest.fn().mockResolvedValue(mockFile) };
      window.showOpenFilePicker = jest.fn().mockResolvedValue([mockHandle]);

      await app.handleOpenFile();
      expect(app.tabs.length).toBe(1);
      expect(app.tabs[0].title).toBe('Picked.md');
    });

    it('should fallback to hidden file input on showOpenFilePicker error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      window.showOpenFilePicker = jest.fn().mockRejectedValue(new Error('Picker failed'));
      const clickSpy = jest.spyOn(app.hiddenFileInput, 'click').mockImplementation(() => {});

      await app.handleOpenFile();
      expect(clickSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should read file object via readFileObject', async () => {
      const mockFile = { name: 'ReadObj.md', text: jest.fn().mockResolvedValue('# Read Obj') };
      await app.readFileObject(mockFile);

      expect(app.tabs.length).toBe(1);
      expect(app.tabs[0].title).toBe('ReadObj.md');
    });

    it('should handle open folder using showDirectoryPicker', async () => {
      const mockFileEntry = {
        kind: 'file',
        name: 'note.md',
        getFile: jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue('note text') })
      };
      const mockDirHandle = {
        name: 'MyFolder',
        values: jest.fn().mockReturnValue([mockFileEntry][Symbol.iterator]())
      };
      window.showDirectoryPicker = jest.fn().mockResolvedValue(mockDirHandle);

      await app.handleOpenFolder();
      expect(app.currentFolder).toBe('MyFolder');
      expect(app.explorerFolderName.textContent).toBe('MyFolder');
    });
  });

  describe('UI Modes, Zoom, Themes & Formatting', () => {
    it('should set view mode', () => {
      app.setViewMode('split');
      expect(app.viewMode).toBe('split');
      expect(app.btnViewSplit.classList.contains('active')).toBe(true);
      expect(app.appContentWrapper.classList.contains('mode-split')).toBe(true);
    });

    it('should set theme', () => {
      app.setTheme('github-light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('github-light');
      expect(app.themeSelector.value).toBe('github-light');
    });

    it('should change zoom level', () => {
      app.changeZoom(0.1);
      expect(app.zoomLevel).toBe(1.1);
      expect(app.zoomText.textContent).toBe('110%');

      app.resetZoom();
      expect(app.zoomLevel).toBe(1.0);
    });

    it('should formatting toolbar button clicks trigger formatting actions', () => {
      app.openDocumentTab('Doc.md', 'sample text', 'Doc.md');
      app.sourceTextarea.focus();
      app.sourceTextarea.selectionStart = 0;
      app.sourceTextarea.selectionEnd = 6; // 'sample'

      app.btnFmtBold.click();
      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '**sample**');
    });
  });

  describe('Find & Search', () => {
    beforeEach(() => {
      app.openDocumentTab('Doc.md', 'Hello world! Hello again!', 'Doc.md');
    });

    it('should open find bar and execute find queries', () => {
      app.openFindBar();
      expect(app.findBar.classList.contains('visible')).toBe(true);

      app.performFind('Hello');
      expect(app.findMatches.length).toBeGreaterThan(0);

      app.findNext();
      expect(app.currentFindIndex).toBe(1);

      app.findPrevious();
      expect(app.currentFindIndex).toBe(0);

      app.closeFindBar();
      expect(app.findBar.classList.contains('visible')).toBe(false);
    });

    it('should handle empty find query', () => {
      app.performFind('');
      expect(app.findMatches.length).toBe(0);
      expect(app.findCount.textContent).toBe('0 / 0');
    });
  });

  describe('Export & Sample Document', () => {
    it('should export to PDF using window.print', () => {
      app.exportToPdf();
      expect(window.print).toHaveBeenCalled();
    });

    it('should export to HTML', () => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:html-url');
      URL.revokeObjectURL = jest.fn();

      app.openDocumentTab('Doc.md', 'Hello world', 'Doc.md');
      app.exportToHtml();

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:html-url');
    });

    it('should open sample document', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('# Sample Content')
      });

      await app.openSampleDocument();
      expect(app.tabs.length).toBe(1);
      expect(app.tabs[0].title).toBe('Exemplo Completo.md');

      delete global.fetch;
    });

    it('should open sample document fallback when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await app.openSampleDocument();
      expect(app.tabs.length).toBe(1);
      expect(app.tabs[0].title).toBe('Exemplo Completo.md');

      delete global.fetch;
    });
  });

  describe('Event Listeners & Keyboard Shortcuts', () => {
    it('should handle global keydown shortcuts', () => {
      const newFileSpy = jest.spyOn(app, 'handleNewFile').mockImplementation(() => {});
      const saveFileSpy = jest.spyOn(app, 'handleSaveFile').mockImplementation(() => {});
      const openFileSpy = jest.spyOn(app, 'handleOpenFile').mockImplementation(() => {});

      // Ctrl + N
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
      expect(newFileSpy).toHaveBeenCalled();

      // Ctrl + S
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      expect(saveFileSpy).toHaveBeenCalled();

      // Ctrl + O
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', ctrlKey: true }));
      expect(openFileSpy).toHaveBeenCalled();
    });

    it('should toggle sidebar on button click', () => {
      app.btnToggleSidebar.click();
      expect(app.isSidebarCollapsed).toBe(true);

      app.btnToggleSidebar.click();
      expect(app.isSidebarCollapsed).toBe(false);
    });

    it('should switch sidebar tabs on click', () => {
      const tocBtn = document.querySelector('.sidebar-tab-btn[data-tab="toc"]');
      tocBtn.click();
      expect(tocBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('bindEvents & setup helper methods', () => {
    it('should call all setup helper methods during bindEvents', () => {
      const spySidebar = jest.spyOn(MDViewerExtensionApp.prototype, 'setupSidebarEvents').mockImplementation(() => {});
      const spyFileToolbar = jest.spyOn(MDViewerExtensionApp.prototype, 'setupFileAndToolbarEvents').mockImplementation(() => {});
      const spyEditorScroll = jest.spyOn(MDViewerExtensionApp.prototype, 'setupEditorAndScrollEvents').mockImplementation(() => {});
      const spyViewTheme = jest.spyOn(MDViewerExtensionApp.prototype, 'setupViewAndThemeEvents').mockImplementation(() => {});
      const spyFindModal = jest.spyOn(MDViewerExtensionApp.prototype, 'setupFindAndModalEvents').mockImplementation(() => {});
      const spyDragDrop = jest.spyOn(MDViewerExtensionApp.prototype, 'setupDragAndDropEvents').mockImplementation(() => {});
      const spyKeyboardWindow = jest.spyOn(MDViewerExtensionApp.prototype, 'setupKeyboardAndWindowEvents').mockImplementation(() => {});

      // Instantiate app (which calls init -> cacheElements -> bindEvents)
      app = new MDViewerExtensionApp();

      expect(spySidebar).toHaveBeenCalled();
      expect(spyFileToolbar).toHaveBeenCalled();
      expect(spyEditorScroll).toHaveBeenCalled();
      expect(spyViewTheme).toHaveBeenCalled();
      expect(spyFindModal).toHaveBeenCalled();
      expect(spyDragDrop).toHaveBeenCalled();
      expect(spyKeyboardWindow).toHaveBeenCalled();

      spySidebar.mockRestore();
      spyFileToolbar.mockRestore();
      spyEditorScroll.mockRestore();
      spyViewTheme.mockRestore();
      spyFindModal.mockRestore();
      spyDragDrop.mockRestore();
      spyKeyboardWindow.mockRestore();
    });

    it('setupSidebarEvents should attach click handler to btnToggleSidebar', () => {
      const toggleSpy = jest.spyOn(app, 'toggleSidebar').mockImplementation(() => {});

      app.btnToggleSidebar.click();
      expect(toggleSpy).toHaveBeenCalled();
    });

    it('setupViewAndThemeEvents should attach click handlers to view mode buttons', () => {
      const setViewModeSpy = jest.spyOn(app, 'setViewMode').mockImplementation(() => {});

      app.btnViewPreview.click();
      expect(setViewModeSpy).toHaveBeenCalledWith('preview');

      app.btnViewSplit.click();
      expect(setViewModeSpy).toHaveBeenCalledWith('split');

      app.btnViewSource.click();
      expect(setViewModeSpy).toHaveBeenCalledWith('source');
    });

    it('setupFileAndToolbarEvents should attach click handler to btnNewFile', () => {
      const newFileSpy = jest.spyOn(app, 'handleNewFile').mockImplementation(() => {});

      app.btnNewFile.click();
      expect(newFileSpy).toHaveBeenCalled();
    });
  });
});
