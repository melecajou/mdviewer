/**
 * @jest-environment jsdom
 */

const MDViewerBase = require('../../shared/js/MDViewerBase');
const MDViewerApp = require('./app');

describe('MDViewerApp - bindEvents refactoring', () => {
  let app;

  beforeEach(() => {
    // Setup minimal DOM elements required by cacheElements or init
    document.body.innerHTML = `
      <button id="btn-toggle-sidebar"></button>
      <button id="btn-new-file"></button>
      <button id="btn-open-file"></button>
      <button id="btn-save-file"></button>
      <button id="btn-open-folder"></button>
      <button id="btn-reload"></button>
      <button id="btn-view-preview"></button>
      <button id="btn-view-split"></button>
      <button id="btn-view-source"></button>
      <button id="btn-find"></button>
      <span id="watch-status"></span>
      <button id="btn-zoom-out"></button>
      <button id="btn-zoom-reset"></button>
      <button id="btn-zoom-in"></button>
      <span id="zoom-level-text"></span>
      <select id="theme-selector"><option value="dark">Dark</option></select>
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

      <div id="app-sidebar"></div>
      <button class="sidebar-tab-btn" data-tab="explorer"></button>
      <div class="sidebar-pane" id="pane-explorer"></div>
      <span id="explorer-folder-name"></span>
      <button id="btn-sidebar-open-folder"></button>
      <input id="explorer-search" />
      <div id="file-tree-container"></div>
      <div id="toc-container"></div>
      <ul id="recent-files-list"></ul>

      <div id="app-content-wrapper"></div>
      <div id="viewport-container"></div>
      <div id="tabs-bar"></div>
      <button id="btn-tab-add"></button>
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

    window.electronAPI = {
      getSettings: jest.fn().mockResolvedValue({}),
      getInitialTargets: jest.fn().mockResolvedValue([]),
      onCliOpenTargets: jest.fn(),
      onFileChanged: jest.fn(),
      onMenuAction: jest.fn()
    };

    // Mock init method before calling constructor to prevent side effects
    jest.spyOn(MDViewerApp.prototype, 'init').mockImplementation(() => {});
    app = new MDViewerApp();
    app.cacheElements();
  });

  it('should call all event binding sub-methods when bindEvents is invoked', () => {
    app.bindSidebarEvents = jest.fn();
    app.bindFileEvents = jest.fn();
    app.bindFormattingEvents = jest.fn();
    app.bindEditorEvents = jest.fn();
    app.bindViewAndThemeEvents = jest.fn();
    app.bindFindEvents = jest.fn();
    app.bindModalEvents = jest.fn();
    app.bindDragAndDropEvents = jest.fn();
    app.bindGlobalKeyboardEvents = jest.fn();

    app.bindEvents();

    expect(app.bindSidebarEvents).toHaveBeenCalledTimes(1);
    expect(app.bindFileEvents).toHaveBeenCalledTimes(1);
    expect(app.bindFormattingEvents).toHaveBeenCalledTimes(1);
    expect(app.bindEditorEvents).toHaveBeenCalledTimes(1);
    expect(app.bindViewAndThemeEvents).toHaveBeenCalledTimes(1);
    expect(app.bindFindEvents).toHaveBeenCalledTimes(1);
    expect(app.bindModalEvents).toHaveBeenCalledTimes(1);
    expect(app.bindDragAndDropEvents).toHaveBeenCalledTimes(1);
    expect(app.bindGlobalKeyboardEvents).toHaveBeenCalledTimes(1);
  });

  it('should bind click listeners in bindSidebarEvents', () => {
    app.toggleSidebar = jest.fn();
    app.bindSidebarEvents();

    app.btnToggleSidebar.click();
    expect(app.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('should bind click listeners in bindFileEvents', () => {
    app.handleNewFile = jest.fn();
    app.handleOpenFile = jest.fn();
    app.handleSaveFile = jest.fn();
    app.bindFileEvents();

    app.btnNewFile.click();
    expect(app.handleNewFile).toHaveBeenCalledTimes(1);

    app.btnOpenFile.click();
    expect(app.handleOpenFile).toHaveBeenCalledTimes(1);

    app.btnSaveFile.click();
    expect(app.handleSaveFile).toHaveBeenCalledTimes(1);
  });
});
