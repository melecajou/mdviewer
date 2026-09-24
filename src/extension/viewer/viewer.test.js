/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

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
