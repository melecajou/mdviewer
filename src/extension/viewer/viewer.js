// MDViewer Chrome Extension - Workspace Tab Script

class MDViewerExtensionApp extends MDViewerBase {
  constructor() {
    super();
    this.init();
  }

  async init() {
    this.cacheElements();
    this.bindEvents();
    this.initMermaid();
    await this.loadSettings();
    this.setupRuntimeListeners();
  }

  cacheElements() {
    // Toolbar & Controls
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    this.btnNewFile = document.getElementById('btn-new-file');
    this.btnOpenFile = document.getElementById('btn-open-file');
    this.btnSaveFile = document.getElementById('btn-save-file');
    this.btnOpenFolder = document.getElementById('btn-open-folder');
    this.btnReload = document.getElementById('btn-reload');
    this.btnViewPreview = document.getElementById('btn-view-preview');
    this.btnViewSplit = document.getElementById('btn-view-split');
    this.btnViewSource = document.getElementById('btn-view-source');
    this.btnFind = document.getElementById('btn-find');
    this.watchStatus = document.getElementById('watch-status');
    this.btnZoomOut = document.getElementById('btn-zoom-out');
    this.btnZoomReset = document.getElementById('btn-zoom-reset');
    this.btnZoomIn = document.getElementById('btn-zoom-in');
    this.zoomText = document.getElementById('zoom-level-text');
    this.themeSelector = document.getElementById('theme-selector');
    this.exportDropdown = document.getElementById('export-dropdown');
    this.btnExportToggle = document.getElementById('btn-export-toggle');
    this.menuExportPdf = document.getElementById('menu-export-pdf');
    this.menuExportHtml = document.getElementById('menu-export-html');

    // Editor Formatting Toolbar
    this.editorToolbar = document.getElementById('editor-toolbar');
    this.btnFmtBold = document.getElementById('btn-fmt-bold');
    this.btnFmtItalic = document.getElementById('btn-fmt-italic');
    this.btnFmtStrike = document.getElementById('btn-fmt-strike');
    this.btnFmtHeading = document.getElementById('btn-fmt-heading');
    this.btnFmtQuote = document.getElementById('btn-fmt-quote');
    this.btnFmtCode = document.getElementById('btn-fmt-code');
    this.btnFmtCodeblock = document.getElementById('btn-fmt-codeblock');
    this.btnFmtUl = document.getElementById('btn-fmt-ul');
    this.btnFmtOl = document.getElementById('btn-fmt-ol');
    this.btnFmtTask = document.getElementById('btn-fmt-task');
    this.btnFmtLink = document.getElementById('btn-fmt-link');
    this.btnFmtImage = document.getElementById('btn-fmt-image');
    this.btnFmtTable = document.getElementById('btn-fmt-table');

    // Hidden pickers
    this.hiddenFileInput = document.getElementById('hidden-file-input');
    this.hiddenFolderInput = document.getElementById('hidden-folder-input');

    // Sidebar
    this.appSidebar = document.getElementById('app-sidebar');
    this.sidebarTabBtns = document.querySelectorAll('.sidebar-tab-btn');
    this.sidebarPanes = document.querySelectorAll('.sidebar-pane');
    this.explorerFolderName = document.getElementById('explorer-folder-name');
    this.btnSidebarOpenFolder = document.getElementById('btn-sidebar-open-folder');
    this.explorerSearch = document.getElementById('explorer-search');
    this.fileTreeContainer = document.getElementById('file-tree-container');
    this.tocContainer = document.getElementById('toc-container');
    this.recentFilesList = document.getElementById('recent-files-list');

    // Content & Tabs
    this.appContentWrapper = document.getElementById('app-content-wrapper');
    this.tabsBar = document.getElementById('tabs-bar');
    this.btnTabAdd = document.getElementById('btn-tab-add');
    this.viewportContainer = document.getElementById('viewport-container');
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.welcomeDropzone = document.getElementById('welcome-dropzone');
    this.btnWelcomeOpenFile = document.getElementById('btn-welcome-open-file');
    this.btnWelcomeSample = document.getElementById('btn-welcome-sample');
    this.sourcePane = document.getElementById('source-pane');
    this.sourceTextarea = document.getElementById('source-textarea');
    this.previewPane = document.getElementById('preview-pane');
    this.markdownContainer = document.getElementById('markdown-container');

    // Find Bar
    this.findBar = document.getElementById('find-bar');
    this.findInput = document.getElementById('find-input');
    this.findCount = document.getElementById('find-count');
    this.btnFindPrev = document.getElementById('find-prev');
    this.btnFindNext = document.getElementById('find-next');
    this.findClose = document.getElementById('find-close');

    // Status Bar
    this.statusFilePath = document.getElementById('status-filepath');
    this.statusStats = document.getElementById('status-stats');
    this.statusReadTime = document.getElementById('status-read-time');

    // Modals
    this.shortcutsModal = document.getElementById('shortcuts-modal');
    this.btnCloseShortcuts = document.getElementById('btn-close-shortcuts');
    this.lightboxModal = document.getElementById('lightbox-modal');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxClose = document.getElementById('lightbox-close');
  }

  async loadSettings() {
    try {
      const stored = await chrome.storage.local.get(['theme', 'zoomLevel', 'viewMode', 'sidebarVisible', 'sidebarTab', 'recentFiles']);
      this.settings = stored || {};
      
      if (this.settings.theme) {
        this.setTheme(this.settings.theme, false);
      }
      if (this.settings.zoomLevel) {
        this.zoomLevel = this.settings.zoomLevel;
        this.applyZoom();
      }
      if (this.settings.viewMode) {
        this.setViewMode(this.settings.viewMode);
      }
      if (this.settings.sidebarVisible === false) {
        this.toggleSidebar(false);
      }
      if (this.settings.sidebarTab) {
        this.switchSidebarTab(this.settings.sidebarTab);
      }
      this.renderRecentFiles();
    } catch {}
  }

  saveSettings() {
    const data = {
      theme: document.documentElement.getAttribute('data-theme') || 'github-dark',
      zoomLevel: this.zoomLevel,
      viewMode: this.viewMode,
      sidebarVisible: !this.isSidebarCollapsed,
      sidebarTab: document.querySelector('.sidebar-tab-btn.active')?.dataset.tab || 'explorer',
      recentFiles: this.settings.recentFiles || []
    };
    chrome.storage.local.set(data);
  }

  setupRuntimeListeners() {
    // Escuta mensagens da extensão (ex: abrir arquivo vindo do popup ou content script)
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'loadInitialDoc') {
        const title = message.filename || 'Documento.md';
        const content = message.content || '';
        this.openDocumentTab(title, content, message.url || title);
      }
    });
  }

  bindEvents() {
    this.setupSidebarEvents();
    this.setupFileAndToolbarEvents();
    this.setupEditorAndScrollEvents();
    this.setupViewAndThemeEvents();
    this.setupFindAndModalEvents();
    this.setupDragAndDropEvents();
    this.setupKeyboardAndWindowEvents();
  }

  setupSidebarEvents() {
    // Sidebar toggle
    if (this.btnToggleSidebar) {
      this.btnToggleSidebar.addEventListener('click', () => this.toggleSidebar());
    }
    
    // Sidebar tabs
    if (this.sidebarTabBtns) {
      this.sidebarTabBtns.forEach(btn => {
        btn.addEventListener('click', () => this.switchSidebarTab(btn.dataset.tab));
      });
    }

    // Folder Open buttons & search
    if (this.btnOpenFolder) {
      this.btnOpenFolder.addEventListener('click', () => this.handleOpenFolder());
    }
    if (this.btnSidebarOpenFolder) {
      this.btnSidebarOpenFolder.addEventListener('click', () => this.handleOpenFolder());
    }
    if (this.explorerSearch) {
      this.explorerSearch.addEventListener('input', (e) => this.filterFileTree(e.target.value));
    }
    if (this.hiddenFolderInput) {
      this.hiddenFolderInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f =>
          f.name.endsWith('.md') || f.name.endsWith('.markdown') || f.name.endsWith('.mdown') || f.name.endsWith('.txt')
        );
        if (files.length > 0) {
          const folderName = files[0].webkitRelativePath.split('/')[0] || 'Pasta';
          this.renderFileListInExplorer(folderName, files);
        }
        this.hiddenFolderInput.value = '';
      });
    }
  }

  setupFileAndToolbarEvents() {
    // File New, Open & Save buttons
    if (this.btnNewFile) this.btnNewFile.addEventListener('click', () => this.handleNewFile());
    if (this.btnOpenFile) this.btnOpenFile.addEventListener('click', () => this.handleOpenFile());
    if (this.btnSaveFile) this.btnSaveFile.addEventListener('click', () => this.handleSaveFile());
    if (this.btnTabAdd) this.btnTabAdd.addEventListener('click', () => this.handleOpenFile());
    if (this.btnWelcomeOpenFile) this.btnWelcomeOpenFile.addEventListener('click', () => this.handleOpenFile());
    if (this.btnWelcomeSample) this.btnWelcomeSample.addEventListener('click', () => this.openSampleDocument());
    if (this.btnReload) this.btnReload.addEventListener('click', () => this.reloadActiveTab());

    // Hidden input change
    if (this.hiddenFileInput) {
      this.hiddenFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(f => this.readFileObject(f));
        this.hiddenFileInput.value = '';
      });
    }

    // Formatting Toolbar buttons
    if (this.btnFmtBold) this.btnFmtBold.addEventListener('click', () => this.formatWrap('**', '**', 'negrito'));
    if (this.btnFmtItalic) this.btnFmtItalic.addEventListener('click', () => this.formatWrap('*', '*', 'itálico'));
    if (this.btnFmtStrike) this.btnFmtStrike.addEventListener('click', () => this.formatWrap('~~', '~~', 'riscado'));
    if (this.btnFmtHeading) this.btnFmtHeading.addEventListener('click', () => this.formatHeading());
    if (this.btnFmtQuote) this.btnFmtQuote.addEventListener('click', () => this.formatPrefix('> '));
    if (this.btnFmtCode) this.btnFmtCode.addEventListener('click', () => this.formatWrap('`', '`', 'código'));
    if (this.btnFmtCodeblock) this.btnFmtCodeblock.addEventListener('click', () => this.formatCodeBlock());
    if (this.btnFmtUl) this.btnFmtUl.addEventListener('click', () => this.formatPrefix('- '));
    if (this.btnFmtOl) this.btnFmtOl.addEventListener('click', () => this.formatPrefix('1. '));
    if (this.btnFmtTask) this.btnFmtTask.addEventListener('click', () => this.formatPrefix('- [ ] '));
    if (this.btnFmtLink) this.btnFmtLink.addEventListener('click', () => this.formatLink());
    if (this.btnFmtImage) this.btnFmtImage.addEventListener('click', () => this.formatImage());
    if (this.btnFmtTable) this.btnFmtTable.addEventListener('click', () => this.formatTable());

    // Export dropdown
    if (this.btnExportToggle) {
      this.btnExportToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.exportDropdown) this.exportDropdown.classList.toggle('open');
      });
    }
    document.addEventListener('click', () => {
      if (this.exportDropdown) this.exportDropdown.classList.remove('open');
    });

    if (this.menuExportPdf) this.menuExportPdf.addEventListener('click', () => this.exportToPdf());
    if (this.menuExportHtml) this.menuExportHtml.addEventListener('click', () => this.exportToHtml());
  }

  setupEditorAndScrollEvents() {
    // Editor Textarea Events
    if (this.sourceTextarea) {
      this.sourceTextarea.addEventListener('input', () => this.handleEditorInput());
      this.sourceTextarea.addEventListener('keydown', (e) => this.handleEditorKeydown(e));

      // Synchronized Scrolling in Split Mode
      this.sourceTextarea.addEventListener('scroll', () => {
        if (this.viewMode !== 'split' || this.isSyncingScroll) return;
        this.isSyncingScroll = true;
        const maxTextarea = this.sourceTextarea.scrollHeight - this.sourceTextarea.clientHeight;
        const maxPreview = this.previewPane ? this.previewPane.scrollHeight - this.previewPane.clientHeight : 0;
        if (maxTextarea > 0 && maxPreview > 0) {
          const pct = this.sourceTextarea.scrollTop / maxTextarea;
          this.previewPane.scrollTop = pct * maxPreview;
        }
        setTimeout(() => { this.isSyncingScroll = false; }, 40);
      });
    }

    if (this.previewPane) {
      this.previewPane.addEventListener('scroll', () => {
        if (this.viewMode !== 'split' || this.isSyncingScroll) return;
        this.isSyncingScroll = true;
        const maxTextarea = this.sourceTextarea ? this.sourceTextarea.scrollHeight - this.sourceTextarea.clientHeight : 0;
        const maxPreview = this.previewPane.scrollHeight - this.previewPane.clientHeight;
        if (maxTextarea > 0 && maxPreview > 0) {
          const pct = this.previewPane.scrollTop / maxPreview;
          this.sourceTextarea.scrollTop = pct * maxTextarea;
        }
        setTimeout(() => { this.isSyncingScroll = false; }, 40);
      });
    }
  }

  setupViewAndThemeEvents() {
    // View Mode buttons
    if (this.btnViewPreview) this.btnViewPreview.addEventListener('click', () => this.setViewMode('preview'));
    if (this.btnViewSplit) this.btnViewSplit.addEventListener('click', () => this.setViewMode('split'));
    if (this.btnViewSource) this.btnViewSource.addEventListener('click', () => this.setViewMode('source'));

    // Zoom buttons
    if (this.btnZoomIn) this.btnZoomIn.addEventListener('click', () => this.changeZoom(0.1));
    if (this.btnZoomOut) this.btnZoomOut.addEventListener('click', () => this.changeZoom(-0.1));
    if (this.btnZoomReset) this.btnZoomReset.addEventListener('click', () => this.resetZoom());

    // Theme selector
    if (this.themeSelector) {
      this.themeSelector.addEventListener('change', (e) => this.setTheme(e.target.value));
    }
  }

  setupFindAndModalEvents() {
    // Find Bar
    if (this.btnFind) this.btnFind.addEventListener('click', () => this.openFindBar());
    if (this.findInput) {
      this.findInput.addEventListener('input', (e) => this.performFind(e.target.value));
      this.findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.shiftKey ? this.findPrevious() : this.findNext();
        } else if (e.key === 'Escape') {
          this.closeFindBar();
        }
      });
    }
    if (this.btnFindNext) this.btnFindNext.addEventListener('click', () => this.findNext());
    if (this.btnFindPrev) this.btnFindPrev.addEventListener('click', () => this.findPrevious());
    if (this.findClose) this.findClose.addEventListener('click', () => this.closeFindBar());

    // Modals
    if (this.btnCloseShortcuts) {
      this.btnCloseShortcuts.addEventListener('click', () => this.shortcutsModal.classList.remove('visible'));
    }
    if (this.shortcutsModal) {
      this.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === this.shortcutsModal) this.shortcutsModal.classList.remove('visible');
      });
    }

    if (this.lightboxClose) {
      this.lightboxClose.addEventListener('click', () => this.lightboxModal.classList.remove('visible'));
    }
    if (this.lightboxModal) {
      this.lightboxModal.addEventListener('click', (e) => {
        if (e.target === this.lightboxModal) this.lightboxModal.classList.remove('visible');
      });
    }
  }

  setupDragAndDropEvents() {
    // Drag & Drop
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.welcomeDropzone) this.welcomeDropzone.classList.add('drag-over');
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.welcomeDropzone) this.welcomeDropzone.classList.remove('drag-over');
    });
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.welcomeDropzone) this.welcomeDropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          await this.readFileObject(file);
        }
      }
    });
  }

  setupKeyboardAndWindowEvents() {
    // Teclas de atalho globais
    document.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const isEditorFocused = document.activeElement === this.sourceTextarea;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        this.handleNewFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        this.handleSaveFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'o' && !e.shiftKey) {
        e.preventDefault();
        this.handleOpenFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (this.activeTabId) this.closeTab(this.activeTabId);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.reloadActiveTab();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.openFindBar();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.exportToPdf();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        if (!isEditorFocused) {
          e.preventDefault();
          this.toggleSidebar();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.switchSidebarTab('toc');
        if (this.isSidebarCollapsed) this.toggleSidebar(true);
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        this.setViewMode('preview');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        this.setViewMode('split');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        this.setViewMode('source');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        this.changeZoom(0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        this.changeZoom(-0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        this.resetZoom();
      } else if (e.key === 'F1') {
        e.preventDefault();
        if (this.shortcutsModal) this.shortcutsModal.classList.add('visible');
      }
    });

    // Auto-reload se janela recuperar foco
    window.addEventListener('focus', () => {
      this.checkActiveTabUpdates();
    });
  }

  // File & Folder Handlers
  async handleOpenFile() {
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandles = await window.showOpenFilePicker({
          types: [{
            description: 'Arquivos Markdown',
            accept: {
              'text/markdown': ['.md', '.markdown', '.mdown'],
              'text/plain': ['.txt']
            }
          }],
          multiple: true
        });

        const filePromises = fileHandles.map(async (handle) => {
          const file = await handle.getFile();
          const content = await file.text();
          return { file, content, handle };
        });

        const filesData = await Promise.all(filePromises);

        for (const data of filesData) {
          this.openDocumentTab(data.file.name, data.content, data.file.name, data.handle);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          this.hiddenFileInput.click();
        }
      }
    } else {
      this.hiddenFileInput.click();
    }
  }

  async readFileObject(file, fileHandle = null) {
    if (!file) return;
    const text = await file.text();
    this.openDocumentTab(file.name, text, file.name, fileHandle);
  }

  async handleOpenFolder() {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        
        async function scanDirectoryHandle(handle, currentRelPath = '', depth = 0) {
          if (depth > 12) return [];
          const promises = [];
          for await (const entry of handle.values()) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.git') {
              continue;
            }
            const relPath = currentRelPath ? `${currentRelPath}/${entry.name}` : entry.name;
            if (entry.kind === 'directory') {
              promises.push(
                scanDirectoryHandle(entry, relPath, depth + 1).then(children => {
                  if (children.length > 0) {
                    return {
                      name: entry.name,
                      path: relPath,
                      relPath: relPath,
                      isDirectory: true,
                      children: children
                    };
                  }
                  return null;
                })
              );
            } else if (entry.kind === 'file') {
              const lower = entry.name.toLowerCase();
              if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.mdown') || lower.endsWith('.txt')) {
                promises.push(Promise.resolve({
                  name: entry.name,
                  path: relPath,
                  relPath: relPath,
                  isDirectory: false,
                  isMarkdown: true,
                  handle: entry
                }));
              }
            }
          }

          const results = await Promise.all(promises);
          const entries = results.filter(Boolean);

          // Ordenar: pastas primeiro, depois arquivos alfabeticamente com ordenação numérica natural (ex: 01, 02... 10)
          return entries.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          });
        }

        const tree = await scanDirectoryHandle(dirHandle);
        this.renderFolderTree(dirHandle.name, tree);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          this.hiddenFolderInput.click();
        }
      }
    } else {
      this.hiddenFolderInput.click();
    }
  }

  renderFileListInExplorer(folderName, files) {
    const root = { name: folderName, isDirectory: true, children: [] };
    const folderMap = new Map();

    for (const file of files) {
      const rel = file.webkitRelativePath || file.name;
      const parts = rel.split('/');
      const startIndex = (parts.length > 1 && parts[0] === folderName) ? 1 : 0;

      let currentLevel = root.children;
      let accumulated = '';

      for (let i = startIndex; i < parts.length; i++) {
        const part = parts[i];
        const isFile = (i === parts.length - 1);
        accumulated = accumulated ? accumulated + '/' + part : part;

        if (isFile) {
          currentLevel.push({
            name: part,
            path: accumulated,
            relPath: accumulated,
            isDirectory: false,
            isMarkdown: true,
            fileObject: file
          });
        } else {
          let folder = folderMap.get(accumulated);
          if (!folder) {
            folder = {
              name: part,
              path: accumulated,
              relPath: accumulated,
              isDirectory: true,
              children: []
            };
            currentLevel.push(folder);
            folderMap.set(accumulated, folder);
          }
          currentLevel = folder.children;
        }
      }
    }

    function sortTree(items) {
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      for (const item of items) {
        if (item.isDirectory && item.children) {
          sortTree(item.children);
        }
      }
      return items;
    }

    const tree = sortTree(root.children);
    this.renderFolderTree(folderName, tree);
  }

  renderFolderTree(folderName, tree) {
    this.currentFolder = folderName;
    this.currentTree = tree;
    this.explorerFolderName.textContent = folderName;
    this.filterFileTree(this.explorerSearch.value);
    this.switchSidebarTab('explorer');
    if (this.isSidebarCollapsed) this.toggleSidebar(true);
  }

  renderTreeNodes(tree, parentEl = null, defaultCollapsed = false) {
    const target = parentEl || this.fileTreeContainer;
    if (!parentEl) target.innerHTML = '';

    const ul = document.createElement('ul');
    ul.className = parentEl ? (defaultCollapsed ? 'tree-folder-children collapsed' : 'tree-folder-children') : 'file-tree';

    tree.forEach(item => {
      const li = document.createElement('li');
      const itemRow = document.createElement('div');
      itemRow.dataset.path = item.relPath || item.path;

      if (item.isDirectory) {
        itemRow.className = 'tree-item tree-folder' + (defaultCollapsed ? '' : ' expanded');
        const hasChildren = item.children && item.children.length > 0;

        itemRow.innerHTML = `
          <span class="tree-arrow ${hasChildren ? '' : 'empty'}">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </span>
          <svg class="folder-icon" viewBox="0 0 16 16" width="14" height="14" fill="#58a6ff"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>
          <span class="tree-item-name" style="font-weight: 500;">${item.name}</span>
        `;
        li.appendChild(itemRow);

        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          this.renderTreeNodes(item.children, childrenContainer, defaultCollapsed);
          if (childrenContainer.firstElementChild) {
            li.appendChild(childrenContainer.firstElementChild);
          }

          itemRow.addEventListener('click', (e) => {
            e.stopPropagation();
            const childUl = li.querySelector(':scope > .tree-folder-children');
            if (childUl) {
              const isCollapsed = childUl.classList.toggle('collapsed');
              if (isCollapsed) {
                itemRow.classList.remove('expanded');
              } else {
                itemRow.classList.add('expanded');
              }
            }
          });
        }
      } else {
        itemRow.className = 'tree-item tree-file';
        const activeTab = this.getActiveTab();
        if (activeTab && (activeTab.path === item.relPath || activeTab.title === item.name)) {
          itemRow.classList.add('active');
        }

        itemRow.innerHTML = `
          <span class="tree-arrow-spacer"></span>
          <svg class="file-icon" viewBox="0 0 16 16" width="14" height="14" fill="#3fb950">
            <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586a1.75 1.75 0 0 1 1.237.513l2.914 2.914c.328.328.513.774.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.06v2.69c0 .138.112.25.25.25h2.69Z"/>
          </svg>
          <span class="tree-item-name">${item.name}</span>
        `;
        itemRow.title = item.relPath || item.name;

        itemRow.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (item.handle) {
            const file = await item.handle.getFile();
            const content = await file.text();
            this.openDocumentTab(item.name, content, item.relPath, item.handle);
          } else if (item.fileObject) {
            const content = await item.fileObject.text();
            this.openDocumentTab(item.name, content, item.relPath);
          }
          this.updateActiveTreeItem(item.relPath);
        });

        li.appendChild(itemRow);
      }

      ul.appendChild(li);
    });

    target.appendChild(ul);
  }

  updateActiveTreeItem(activePath) {
    if (!this.fileTreeContainer || !activePath) return;

    const activeItems = this.fileTreeContainer.querySelectorAll('.tree-item.active, .file-tree-item.active');
    activeItems.forEach(el => el.classList.remove('active'));

    const treeItems = this.fileTreeContainer.querySelectorAll('.tree-item');
    let targetItem = null;
    treeItems.forEach(el => {
      const p = el.dataset.path;
      if (p && (p === activePath || activePath.endsWith('/' + p) || p.endsWith('/' + activePath) || activePath === el.querySelector('.tree-item-name')?.textContent)) {
        targetItem = el;
      }
    });

    if (targetItem) {
      targetItem.classList.add('active');

      // Expand ancestor folders
      let parent = targetItem.parentElement;
      while (parent && parent !== this.fileTreeContainer) {
        if (parent.classList && parent.classList.contains('tree-folder-children')) {
          parent.classList.remove('collapsed');
          const folderLi = parent.parentElement;
          if (folderLi) {
            const folderRow = folderLi.querySelector(':scope > .tree-folder');
            if (folderRow) folderRow.classList.add('expanded');
          }
        }
        parent = parent.parentElement;
      }
    }
  }

  filterFileTree(query = '') {
    const q = (query || '').toLowerCase().trim();

    if (!this.currentTree || this.currentTree.length === 0) {
      this.renderOpenFilesFallback();
      return;
    }

    if (!q) {
      this.fileTreeContainer.innerHTML = '';
      this.renderTreeNodes(this.currentTree, this.fileTreeContainer, false);
      const activeTab = this.getActiveTab();
      if (activeTab) {
        this.updateActiveTreeItem(activeTab.path);
      }
      return;
    }

    function filterNodes(nodes) {
      const res = [];
      for (const node of nodes) {
        if (node.isDirectory) {
          const matchingChildren = filterNodes(node.children || []);
          if (matchingChildren.length > 0 || node.name.toLowerCase().includes(q)) {
            res.push({
              ...node,
              children: matchingChildren.length > 0 ? matchingChildren : node.children
            });
          }
        } else if (node.name.toLowerCase().includes(q) || (node.relPath && node.relPath.toLowerCase().includes(q))) {
          res.push(node);
        }
      }
      return res;
    }

    const filtered = filterNodes(this.currentTree);
    if (filtered.length === 0) {
      this.fileTreeContainer.innerHTML = '';
      const p = document.createElement('p');
      p.style.fontSize = '0.78rem';
      p.style.color = 'var(--text-muted)';
      p.style.textAlign = 'center';
      p.style.marginTop = '20px';
      p.textContent = `Nenhum arquivo ou pasta encontrado com "${query}".`;
      this.fileTreeContainer.appendChild(p);
      return;
    }

    this.fileTreeContainer.innerHTML = '';
    this.renderTreeNodes(filtered, this.fileTreeContainer, false);
    const activeTab = this.getActiveTab();
    if (activeTab) {
      this.updateActiveTreeItem(activeTab.path);
    }
  }

  renderOpenFilesFallback() {
    if (this.tabs.length > 0) {
      this.fileTreeContainer.innerHTML = `
        <div class="sidebar-section-title">Arquivos Abertos (${this.tabs.length})</div>
        <div class="sidebar-open-files-list">
          ${this.tabs.map(t => `
            <div class="file-tree-item ${t.id === this.activeTabId ? 'active' : ''}" data-tab-id="${t.id}" title="${t.path}">
              <svg class="file-icon" viewBox="0 0 16 16" width="14" height="14" fill="#3fb950">
                <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586a1.75 1.75 0 0 1 1.237.513l2.914 2.914c.328.328.513.774.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.06v2.69c0 .138.112.25.25.25h2.69Z"/>
              </svg>
              <span class="tree-item-name">${t.title}</span>
            </div>
          `).join('')}
        </div>
        <div class="sidebar-folder-prompt">
          <p>Navegue por todos os arquivos Markdown de uma pasta do seu computador:</p>
          <button class="btn-primary" id="btn-sidebar-prompt-open-folder">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75ZM1.5 2.75a.25.25 0 0 1 .25-.25H5c.18 0 .36.09.47.23l1.15 1.53A1.75 1.75 0 0 0 8.02 5h6.23a.25.25 0 0 1 .25.25v8a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25Z"/></svg>
            <span>Abrir Pasta do Projeto</span>
          </button>
        </div>
      `;
      this.fileTreeContainer.querySelectorAll('.file-tree-item').forEach(el => {
        el.addEventListener('click', () => {
          const tabId = el.getAttribute('data-tab-id');
          if (tabId) this.activateTab(tabId);
        });
      });
      const promptBtn = document.getElementById('btn-sidebar-prompt-open-folder');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => this.handleOpenFolder());
      }
    } else {
      this.fileTreeContainer.innerHTML = `
        <div class="sidebar-folder-prompt">
          <p>Nenhuma pasta aberta no momento.</p>
          <button class="btn-primary" id="btn-sidebar-prompt-open-folder">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75ZM1.5 2.75a.25.25 0 0 1 .25-.25H5c.18 0 .36.09.47.23l1.15 1.53A1.75 1.75 0 0 0 8.02 5h6.23a.25.25 0 0 1 .25.25v8a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25Z"/></svg>
            <span>Abrir Pasta</span>
          </button>
        </div>
      `;
      const promptBtn = document.getElementById('btn-sidebar-prompt-open-folder');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => this.handleOpenFolder());
      }
    }
  }

  // Tab Management
  openDocumentTab(title, content, path = title, fileHandle = null) {
    // Se já estiver aberto em uma aba, ativa a aba
    const existing = this.tabs.find(t => t.path === path);
    if (existing) {
      this.activateTab(existing.id);
      return;
    }

    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newTab = {
      id: tabId,
      title: title || 'Sem Título.md',
      path: path,
      content: content,
      savedContent: content,
      fileHandle: fileHandle,
      isDirty: false,
      scrollPos: 0
    };

    this.tabs.push(newTab);
    this.addRecentFile(title, path);
    this.activateTab(tabId);

    // Se nenhuma pasta estiver carregada no explorador, alterna para a aba de Índice (TOC)
    if (!this.currentFolder) {
      this.switchSidebarTab('toc');
    }
  }

  renderTabsBar() {
    // Remover botões de abas existentes exceto o botão de adicionar
    const existingTabElems = this.tabsBar.querySelectorAll('.tab-item');
    existingTabElems.forEach(el => el.remove());

    this.tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `tab-item ${tab.id === this.activeTabId ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`;
      tabEl.id = `tab-${tab.id}`;
      tabEl.title = tab.path;
      tabEl.innerHTML = `
        <span class="tab-title">${tab.title}</span>
        <button class="tab-close-btn" title="Fechar aba">✕</button>
      `;

      tabEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close-btn')) {
          this.activateTab(tab.id);
        }
      });

      tabEl.querySelector('.tab-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      });

      this.tabsBar.insertBefore(tabEl, this.btnTabAdd);
    });

    if (this.tabs.length === 0) {
      if (this.viewportContainer) this.viewportContainer.classList.remove('has-tabs');
      this.welcomeScreen.style.display = 'flex';
      this.welcomeScreen.classList.remove('hidden');
      this.sourcePane.style.display = 'none';
      this.previewPane.style.display = 'none';
      this.statusFilePath.textContent = 'Nenhum arquivo';
      this.statusStats.textContent = '0 palavras • 0 linhas';
      this.statusReadTime.textContent = '1 min de leitura';
      this.tocContainer.innerHTML = `<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum cabeçalho encontrado.</p>`;
    } else {
      if (this.viewportContainer) this.viewportContainer.classList.add('has-tabs');
      this.welcomeScreen.style.display = 'none';
      this.welcomeScreen.classList.add('hidden');
    }
  }

  activateTab(tabId) {
    this.activeTabId = tabId;
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    this.renderTabsBar();

    // Ocultar welcome screen expressamente
    if (this.viewportContainer) this.viewportContainer.classList.add('has-tabs');
    this.welcomeScreen.style.display = 'none';
    this.welcomeScreen.classList.add('hidden');

    this.applyViewModePanes();

    this.sourceTextarea.value = tab.content;
    this.renderMarkdown(tab.content);
    this.statusFilePath.textContent = tab.path;
    document.title = `${tab.isDirty ? '● ' : ''}${tab.title} - MDViewer Workspace`;

    if (!this.currentFolder) {
      this.filterFileTree(this.explorerSearch.value);
    } else {
      this.updateActiveTreeItem(tab.path);
    }
  }

  applyViewModePanes() {
    if (this.tabs.length === 0) {
      if (this.viewportContainer) this.viewportContainer.classList.remove('has-tabs');
      this.welcomeScreen.style.display = 'flex';
      this.welcomeScreen.classList.remove('hidden');
      this.previewPane.style.display = 'none';
      this.sourcePane.style.display = 'none';
      return;
    }

    if (this.viewportContainer) this.viewportContainer.classList.add('has-tabs');
    this.welcomeScreen.style.display = 'none';
    this.welcomeScreen.classList.add('hidden');

    if (this.viewMode === 'preview') {
      this.previewPane.style.display = 'block';
      this.sourcePane.style.display = 'none';
    } else if (this.viewMode === 'source') {
      this.previewPane.style.display = 'none';
      this.sourcePane.style.display = 'block';
    } else { // split
      this.previewPane.style.display = 'block';
      this.sourcePane.style.display = 'block';
    }
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const tab = this.tabs[index];
    if (tab.isDirty) {
      if (!confirm(`O documento "${tab.title}" possui alterações não salvas. Deseja fechar mesmo assim?`)) {
        return;
      }
    }

    this.tabs.splice(index, 1);
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        const nextTab = this.tabs[Math.max(0, index - 1)];
        this.activateTab(nextTab.id);
      } else {
        this.activeTabId = null;
        this.renderTabsBar();
        this.applyViewModePanes();
        this.statusFilePath.textContent = 'Nenhum arquivo';
        this.statusStats.textContent = '0 palavras • 0 linhas';
        this.statusReadTime.textContent = '1 min de leitura';
        this.tocContainer.innerHTML = `<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum cabeçalho encontrado.</p>`;
        document.title = 'MDViewer Workspace';
      }
    } else {
      this.renderTabsBar();
    }

    if (!this.currentFolder) {
      this.filterFileTree(this.explorerSearch.value);
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  async reloadActiveTab() {
    const tab = this.getActiveTab();
    if (!tab) return;
    if (tab.isDirty) return;

    if (tab.fileHandle) {
      try {
        const file = await tab.fileHandle.getFile();
        tab.content = await file.text();
        tab.savedContent = tab.content;
        this.sourceTextarea.value = tab.content;
        this.renderMarkdown(tab.content);
      } catch (err) {
        console.error('Erro ao recarregar aba:', err);
      }
    }
  }

  // ---------------- Editor & Document Management ----------------

  handleNewFile() {
    this.openDocumentTab('Sem Título.md', '# Novo Documento\n\nComece a escrever aqui...\n', 'novo-' + Date.now() + '.md');
    const activeTab = this.getActiveTab();
    if (activeTab) {
      activeTab.savedContent = '';
      this.updateTabDirty(activeTab, true);
    }
    if (this.viewMode === 'preview') {
      this.setViewMode('split');
    }
    this.sourceTextarea.focus();
    this.sourceTextarea.setSelectionRange(this.sourceTextarea.value.length, this.sourceTextarea.value.length);
  }

  async handleSaveFile() {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;
    return await this.saveTab(activeTab);
  }

  async saveTab(tab) {
    if (!tab) return false;
    try {
      if (tab.fileHandle) {
        const writable = await tab.fileHandle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        tab.savedContent = tab.content;
        this.updateTabDirty(tab, false);
        this.showSaveFeedback('Salvo!');
        return true;
      } else if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: tab.title || 'documento.md',
          types: [{
            description: 'Arquivos Markdown',
            accept: { 'text/markdown': ['.md', '.markdown'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        tab.fileHandle = handle;
        tab.title = handle.name;
        tab.path = handle.name;
        tab.savedContent = tab.content;
        this.updateTabDirty(tab, false);
        this.renderTabsBar();
        this.showSaveFeedback('Salvo!');
        return true;
      } else {
        const blob = new Blob([tab.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tab.title || 'documento.md';
        a.click();
        URL.revokeObjectURL(url);
        tab.savedContent = tab.content;
        this.updateTabDirty(tab, false);
        this.showSaveFeedback('Baixado!');
        return true;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert('Erro ao salvar arquivo: ' + err.message);
      }
      return false;
    }
  }

  updateTabDirty(tab, isDirty) {
    tab.isDirty = isDirty;
    const tabEl = document.getElementById(`tab-${tab.id}`);
    if (tabEl) {
      tabEl.classList.toggle('dirty', isDirty);
    }
    if (this.activeTabId === tab.id) {
      document.title = `${isDirty ? '● ' : ''}${tab.title} - MDViewer Workspace`;
    }
  }

  handleEditorInput() {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    activeTab.content = this.sourceTextarea.value;
    const isDirty = activeTab.content !== activeTab.savedContent;
    if (activeTab.isDirty !== isDirty) {
      this.updateTabDirty(activeTab, isDirty);
    }

    clearTimeout(this.renderDebounceTimer);
    this.renderDebounceTimer = setTimeout(() => {
      this.renderMarkdown(activeTab.content);
    }, 150);
  }

  toggleTaskCheckbox(taskIndex, isChecked) {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    let currentIndex = 0;
    const regex = /^(\s*[-*+]\s+\[)([ xX])(\]\s+.*)$/gm;
    activeTab.content = activeTab.content.replace(regex, (match, prefix, checkState, suffix) => {
      if (currentIndex === taskIndex) {
        currentIndex++;
        return `${prefix}${isChecked ? 'x' : ' '}${suffix}`;
      }
      currentIndex++;
      return match;
    });

    this.sourceTextarea.value = activeTab.content;
    const isDirty = activeTab.content !== activeTab.savedContent;
    this.updateTabDirty(activeTab, isDirty);
  }

  async checkActiveTabUpdates() {
    const tab = this.getActiveTab();
    if (tab && tab.fileHandle) {
      try {
        const file = await tab.fileHandle.getFile();
        const fresh = await file.text();
        if (fresh && fresh !== tab.content) {
          tab.content = fresh;
          this.sourceTextarea.value = tab.content;
          this.renderMarkdown(tab.content);
        }
      } catch {}
    }
  }

  // Render Engine
  renderMarkdown(content) {
    if (!window.MDViewerEngine || !window.MDViewerEngine.parseMarkdown) {
      this.markdownContainer.innerHTML = `<div style="padding: 24px; color: var(--color-error, #f85149);"><p><strong>Erro:</strong> Motor MDViewerEngine não foi carregado.</p></div>`;
      return;
    }

    let parsed;
    try {
      parsed = window.MDViewerEngine.parseMarkdown(content);
    } catch (err) {
      console.error('Erro ao renderizar markdown:', err);
      this.markdownContainer.innerHTML = `<div style="padding: 24px; color: var(--color-error, #f85149);">
        <h3>Erro ao processar markdown</h3>
        <p>${err.message}</p>
        <pre style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; overflow-x: auto;">${err.stack || ''}</pre>
      </div>`;
      return;
    }

    const { html, headings, stats } = parsed;

    // Inject HTML (Sanitized to prevent XSS)
    const sanitizedHtml = window.DOMPurify ? window.DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true }
    }) : html;

    this.markdownContainer.innerHTML = sanitizedHtml;
    this.headings = headings;

    // Attach heading anchor copy link
    const headingAnchors = this.markdownContainer.querySelectorAll('.heading-anchor');
    headingAnchors.forEach(anchor => {
      anchor.addEventListener('click', () => {
        const id = anchor.parentElement.id;
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + window.location.search + '#' + id);
      });
    });

    // Resolver caminhos de imagens relativas baseando-se no caminho do arquivo atual
    const activeTab = this.getActiveTab();
    if (activeTab && activeTab.path) {
      let basePath = '';
      if (activeTab.path.includes('/')) {
        basePath = activeTab.path.substring(0, activeTab.path.lastIndexOf('/') + 1);
      } else if (activeTab.path.includes('\\')) {
        basePath = activeTab.path.substring(0, activeTab.path.lastIndexOf('\\') + 1);
      }

      this.markdownContainer.querySelectorAll('.md-image, img').forEach(img => {
        const rawSrc = img.getAttribute('src');
        if (rawSrc && !rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:') && !rawSrc.startsWith('chrome-extension:')) {
          if (rawSrc.startsWith('file://')) {
            // URL completa
          } else if (basePath.startsWith('file://')) {
            img.src = basePath + rawSrc;
          } else if (basePath.startsWith('/') || /^[a-zA-Z]:/.test(basePath)) {
            img.src = 'file://' + basePath + rawSrc;
          }
        }

        // Fallback de erro para ícones da aplicação
        img.addEventListener('error', () => {
          const s = img.getAttribute('src') || '';
          if (s.includes('icon.svg')) {
            img.src = chrome.runtime.getURL('assets/icon.svg');
          } else if (s.includes('icon.png')) {
            img.src = chrome.runtime.getURL('assets/icon.png');
          }
        }, { once: true });
      });
    }

    // Atualizar status bar
    this.statusStats.textContent = `${stats.words.toLocaleString()} palavras • ${stats.lines} linhas`;
    this.statusReadTime.textContent = `${stats.readTimeMinutes} min de leitura`;

    // Atualizar TOC
    this.renderTOC(headings);

    // Conectar botões de copiar código
    this.markdownContainer.querySelectorAll('.copy-code-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = decodeURIComponent(btn.getAttribute('data-code') || '');
        navigator.clipboard.writeText(code).then(() => {
          const span = btn.querySelector('.copy-text');
          if (span) {
            const original = span.textContent;
            span.textContent = 'Copiado!';
            setTimeout(() => { span.textContent = original; }, 1800);
          }
        });
      });
    });

    // Conectar lightbox de imagem
    this.markdownContainer.querySelectorAll('.md-image').forEach(img => {
      img.addEventListener('click', () => {
        this.lightboxImg.src = img.src;
        this.lightboxModal.classList.add('visible');
      });
    });

    // Setup interactive task checkboxes in preview
    const taskCheckboxes = this.markdownContainer.querySelectorAll('.task-list-item input[type="checkbox"]');
    taskCheckboxes.forEach((chk, index) => {
      chk.removeAttribute('disabled');
      chk.style.cursor = 'pointer';
      chk.addEventListener('change', () => {
        this.toggleTaskCheckbox(index, chk.checked);
      });
    });

    // Renderizar diagramas Mermaid
    if (window.mermaid) {
      try {
        const isDark = !document.documentElement.getAttribute('data-theme')?.includes('light');
        window.mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'strict'
        });
        window.mermaid.run({
          nodes: this.markdownContainer.querySelectorAll('.mermaid')
        });
      } catch {}
    }
  }

  renderTOC(headings) {
    if (!headings || headings.length === 0) {
      this.tocContainer.innerHTML = `<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum cabeçalho no documento.</p>`;
      return;
    }

    const escapeHtml = (unsafe) => {
      return (unsafe || '').toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    this.tocContainer.innerHTML = headings.map(h => {
      const safeText = escapeHtml(h.text);
      return `
      <div class="toc-item level-${Math.min(h.level, 4)}" data-id="${h.id}" title="${safeText}">
        <span class="toc-text">${safeText}</span>
      </div>
    `;
    }).join('');

    this.tocContainer.querySelectorAll('.toc-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // UI Modes & Themes
  setViewMode(mode) {
    this.viewMode = mode;
    this.btnViewPreview.classList.toggle('active', mode === 'preview');
    this.btnViewSplit.classList.toggle('active', mode === 'split');
    this.btnViewSource.classList.toggle('active', mode === 'source');

    this.appContentWrapper.classList.remove('mode-preview', 'mode-split', 'mode-source');
    this.appContentWrapper.classList.add(`mode-${mode}`);

    this.saveSettings();
  }

  setTheme(themeName, save = true) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.themeSelector.value = themeName;
    if (save) this.saveSettings();
  }

  changeZoom(delta) {
    this.zoomLevel = Math.max(0.6, Math.min(2.0, this.zoomLevel + delta));
    this.applyZoom();
  }

  applyZoom() {
    this.zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    this.markdownContainer.style.zoom = this.zoomLevel;
    this.sourceTextarea.style.fontSize = `${0.9 * this.zoomLevel}rem`;
    this.saveSettings();
  }

  // Recents
  addRecentFile(title, path) {
    if (!this.settings.recentFiles) this.settings.recentFiles = [];
    this.settings.recentFiles = this.settings.recentFiles.filter(f => f.path !== path);
    this.settings.recentFiles.unshift({ title, path, date: Date.now() });
    if (this.settings.recentFiles.length > 20) this.settings.recentFiles.pop();
    this.saveSettings();
    this.renderRecentFiles();
  }

  renderRecentFiles() {
    const list = this.settings.recentFiles || [];
    if (list.length === 0) {
      this.recentFilesList.innerHTML = `<li style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum arquivo recente.</li>`;
      return;
    }

    this.recentFilesList.innerHTML = list.map(item => `
      <li class="recent-item" title="${item.path}">
        <span class="recent-title">${item.title}</span>
        <span class="recent-path">${item.path}</span>
      </li>
    `).join('');
  }

  // Find in document
  openFindBar() {
    this.findBar.classList.add('visible');
    this.findInput.focus();
    this.findInput.select();
  }

  performFind(query) {
    this.clearFindHighlights();
    if (!query || query.length < 2) {
      this.findCount.textContent = '0 / 0';
      return;
    }

    const walker = document.createTreeWalker(this.markdownContainer, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
        nodes.push(node);
      }
    }

    this.findMatches = [];
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    nodes.forEach(textNode => {
      const text = textNode.nodeValue;
      let match;
      if (regex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, (m) => `<mark class="find-match">${m}</mark>`);
        textNode.replaceWith(span);
        span.querySelectorAll('.find-match').forEach(m => this.findMatches.push(m));
      }
    });

    this.currentFindIndex = this.findMatches.length > 0 ? 0 : -1;
    this.updateFindHighlight();
  }

  findNext() {
    if (this.findMatches.length === 0) return;
    this.currentFindIndex = (this.currentFindIndex + 1) % this.findMatches.length;
    this.updateFindHighlight();
  }

  findPrevious() {
    if (this.findMatches.length === 0) return;
    this.currentFindIndex = (this.currentFindIndex - 1 + this.findMatches.length) % this.findMatches.length;
    this.updateFindHighlight();
  }

  updateFindHighlight() {
    this.findMatches.forEach((el, idx) => {
      el.classList.toggle('current', idx === this.currentFindIndex);
    });

    if (this.currentFindIndex >= 0 && this.findMatches[this.currentFindIndex]) {
      this.findMatches[this.currentFindIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.findCount.textContent = `${this.currentFindIndex + 1} / ${this.findMatches.length}`;
    } else {
      this.findCount.textContent = '0 / 0';
    }
  }

  clearFindHighlights() {
    this.markdownContainer.querySelectorAll('.find-match').forEach(mark => {
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    this.findMatches = [];
    this.currentFindIndex = -1;
  }

  // Export
  exportToPdf() {
    window.print();
  }

  exportToHtml() {
    const tab = this.getActiveTab();
    const title = tab ? tab.title.replace(/\.[^/.]+$/, '') : 'documento';
    const contentHtml = this.markdownContainer.innerHTML;
    const theme = document.documentElement.getAttribute('data-theme') || 'github-dark';

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; padding: 40px; margin: 0 auto; max-width: 900px; }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${contentHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async openSampleDocument() {
    try {
      const response = await fetch('../assets/sample.md');
      if (response.ok) {
        const text = await response.text();
        this.openDocumentTab('Exemplo Completo.md', text, 'sample.md');
        return;
      }
    } catch {}

    // Fallback caso fetch falhe
    const sampleText = `# 🚀 MDViewer para Google Chrome

Bem-vindo ao **MDViewer**! Este leitor completo suporta todo o padrão **GitHub Flavored Markdown**, fórmulas matemáticas e diagramas.

## 📊 Diagrama Mermaid
\`\`\`mermaid
graph TD
    A[Arquivo Markdown] --> B(MDViewer Engine)
    B --> C[GFM Formatado]
    B --> D[KaTeX Math]
    B --> E[Mermaid SVG]
\`\`\`

## 🧮 Fórmulas Matemáticas LaTeX
$$e^{i\\pi} + 1 = 0$$

Equação em linha: $E = mc^2$.

## 💡 Callouts GitHub
> [!TIP]
> Arraste qualquer arquivo Markdown diretamente para esta aba para visualizar instantaneamente!

> [!NOTE]
> Você também pode abrir pastas locais pelo botão **Pasta** na barra superior!
`;
    this.openDocumentTab('Exemplo Completo.md', sampleText, 'sample.md');
  }
}

// Inicializar aplicação ao carregar
window.addEventListener('DOMContentLoaded', () => {
  window.mdViewerApp = new MDViewerExtensionApp();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MDViewerExtensionApp;
}
