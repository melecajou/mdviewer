/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const DOMPurify = require('dompurify');
const MDViewerBase = require('../../shared/js/MDViewerBase');

global.MDViewerBase = MDViewerBase;
global.DOMPurify = DOMPurify;
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Load viewer.js
const viewerCode = fs.readFileSync(path.join(__dirname, 'viewer.js'), 'utf8');
(0, eval)(viewerCode + '\n global.MDViewerExtensionApp = MDViewerExtensionApp;');

describe('Extension Viewer Sanitization', () => {
  let app;

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
      <div class="sidebar-tab-btn"></div>
      <div class="sidebar-pane"></div>
      <div id="explorer-folder-name"></div>
      <div id="btn-sidebar-open-folder"></div>
      <input id="explorer-search" />
      <div id="file-tree-container"></div>
      <div id="toc-container"></div>
      <ul id="recent-files-list"></ul>
      <div id="app-content-wrapper"></div>
      <div id="tabs-bar"></div>
      <button id="btn-tab-add"></button>
      <div id="viewport-container"></div>
      <div id="welcome-screen"></div>
      <div id="welcome-dropzone"></div>
      <button id="btn-welcome-open-file"></button>
      <button id="btn-welcome-sample"></button>
      <div id="source-pane"></div>
      <textarea id="source-textarea"></textarea>
      <div id="preview-pane"></div>
      <div id="markdown-container"></div>
      <div id="find-bar"></div>
      <input id="find-input" />
      <div id="find-count"></div>
      <button id="find-prev"></button>
      <button id="find-next"></button>
      <button id="find-close"></button>
      <div id="status-filepath"></div>
      <div id="status-stats"></div>
      <div id="status-read-time"></div>
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
    app = new global.MDViewerExtensionApp();
  });

  afterEach(() => {
    delete window.DOMPurify;
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
