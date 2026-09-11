// MDViewer Desktop Main Renderer Script

class MDViewerApp extends MDViewerBase {
  constructor() {
    super();
    this.init();
  }

  async init() {
    this.cacheElements();
    this.setupIpcListeners();
    this.bindEvents();
    this.initMermaid();
    await this.loadSettings();
    this.updateTabsVisibility();
    await this.handleInitialTargets();
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
    this.viewportContainer = document.getElementById('viewport-container');
    this.tabsBar = document.getElementById('tabs-bar');
    this.btnTabAdd = document.getElementById('btn-tab-add');
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
    this.findPrev = document.getElementById('find-prev');
    this.findNext = document.getElementById('find-next');
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
      this.settings = await window.electronAPI.getSettings();
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
      // If initial targets are present, don't restore old folder
      const initialTargets = await window.electronAPI.getInitialTargets();
      if (Array.isArray(initialTargets) && initialTargets.length > 0) {
        this.pendingInitialTargets = initialTargets;
      } else if (this.settings.lastOpenedFolder) {
        this.loadFolder(this.settings.lastOpenedFolder, false, false);
      }
      this.renderRecentFiles();
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  saveSettings() {
    window.electronAPI.saveSettings({
      theme: document.documentElement.getAttribute('data-theme') || 'github-dark',
      zoomLevel: this.zoomLevel,
      viewMode: this.viewMode,
      sidebarVisible: !this.isSidebarCollapsed,
      sidebarTab: document.querySelector('.sidebar-tab-btn.active')?.dataset.tab || 'explorer'
    });
  }

  bindEvents() {
    // Sidebar toggle
    this.btnToggleSidebar.addEventListener('click', () => this.toggleSidebar());
    
    // Sidebar tabs
    this.sidebarTabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchSidebarTab(btn.dataset.tab));
    });

    // File New, Open & Save buttons
    if (this.btnNewFile) this.btnNewFile.addEventListener('click', () => this.handleNewFile());
    this.btnOpenFile.addEventListener('click', () => this.handleOpenFile());
    if (this.btnSaveFile) this.btnSaveFile.addEventListener('click', () => this.handleSaveFile());
    this.btnTabAdd.addEventListener('click', () => this.handleOpenFile());
    this.btnWelcomeOpenFile.addEventListener('click', () => this.handleOpenFile());
    this.btnWelcomeSample.addEventListener('click', () => this.openSampleDocument());

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

    // Editor Textarea Events
    this.sourceTextarea.addEventListener('input', () => this.handleEditorInput());
    this.sourceTextarea.addEventListener('keydown', (e) => this.handleEditorKeydown(e));

    // Synchronized Scrolling in Split Mode
    this.sourceTextarea.addEventListener('scroll', () => {
      if (this.viewMode !== 'split' || this.isSyncingScroll) return;
      this.isSyncingScroll = true;
      const maxTextarea = this.sourceTextarea.scrollHeight - this.sourceTextarea.clientHeight;
      const maxPreview = this.previewPane.scrollHeight - this.previewPane.clientHeight;
      if (maxTextarea > 0 && maxPreview > 0) {
        const pct = this.sourceTextarea.scrollTop / maxTextarea;
        this.previewPane.scrollTop = pct * maxPreview;
      }
      setTimeout(() => { this.isSyncingScroll = false; }, 40);
    });

    this.previewPane.addEventListener('scroll', () => {
      if (this.viewMode !== 'split' || this.isSyncingScroll) return;
      this.isSyncingScroll = true;
      const maxTextarea = this.sourceTextarea.scrollHeight - this.sourceTextarea.clientHeight;
      const maxPreview = this.previewPane.scrollHeight - this.previewPane.clientHeight;
      if (maxTextarea > 0 && maxPreview > 0) {
        const pct = this.previewPane.scrollTop / maxPreview;
        this.sourceTextarea.scrollTop = pct * maxTextarea;
      }
      setTimeout(() => { this.isSyncingScroll = false; }, 40);
    });

    // Folder Open buttons
    this.btnOpenFolder.addEventListener('click', () => this.handleOpenFolder());
    this.btnSidebarOpenFolder.addEventListener('click', () => this.handleOpenFolder());
    this.explorerSearch.addEventListener('input', (e) => this.filterFileTree(e.target.value));

    // Reload button
    this.btnReload.addEventListener('click', () => this.reloadActiveTab());

    // View Mode buttons
    this.btnViewPreview.addEventListener('click', () => this.setViewMode('preview'));
    this.btnViewSplit.addEventListener('click', () => this.setViewMode('split'));
    this.btnViewSource.addEventListener('click', () => this.setViewMode('source'));

    // Zoom buttons
    this.btnZoomIn.addEventListener('click', () => this.changeZoom(0.1));
    this.btnZoomOut.addEventListener('click', () => this.changeZoom(-0.1));
    this.btnZoomReset.addEventListener('click', () => this.resetZoom());

    // Theme selector
    this.themeSelector.addEventListener('change', (e) => this.setTheme(e.target.value));

    // Export dropdown
    this.btnExportToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.exportDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => this.exportDropdown.classList.remove('open'));

    this.menuExportPdf.addEventListener('click', () => this.exportToPdf());
    this.menuExportHtml.addEventListener('click', () => this.exportToHtml());

    // Find Bar
    this.btnFind.addEventListener('click', () => this.openFindBar());
    this.findInput.addEventListener('input', (e) => this.performFind(e.target.value));
    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.shiftKey ? this.findPrevious() : this.findNext();
      } else if (e.key === 'Escape') {
        this.closeFindBar();
      }
    });
    this.findNext.addEventListener('click', () => this.findNext());
    this.findPrev.addEventListener('click', () => this.findPrevious());
    this.findClose.addEventListener('click', () => this.closeFindBar());

    // Modals
    this.btnCloseShortcuts.addEventListener('click', () => this.shortcutsModal.classList.remove('visible'));
    this.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === this.shortcutsModal) this.shortcutsModal.classList.remove('visible');
    });

    this.lightboxClose.addEventListener('click', () => this.lightboxModal.classList.remove('visible'));
    this.lightboxModal.addEventListener('click', (e) => {
      if (e.target === this.lightboxModal) this.lightboxModal.classList.remove('visible');
    });

    // Drag & Drop
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.welcomeDropzone.classList.add('drag-over');
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.welcomeDropzone.classList.remove('drag-over');
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.welcomeDropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          if (file.path) {
            this.openFile(file.path);
          }
        }
      }
    });

    // Synchronized scroll in Split View
    let isSyncingSource = false;
    let isSyncingPreview = false;
    this.sourceTextarea.addEventListener('scroll', () => {
      if (this.viewMode === 'split' && !isSyncingPreview) {
        isSyncingSource = true;
        const ratio = this.sourceTextarea.scrollTop / (this.sourceTextarea.scrollHeight - this.sourceTextarea.clientHeight || 1);
        this.previewPane.scrollTop = ratio * (this.previewPane.scrollHeight - this.previewPane.clientHeight);
        setTimeout(() => { isSyncingSource = false; }, 50);
      }
    });
    this.previewPane.addEventListener('scroll', () => {
      if (this.viewMode === 'split' && !isSyncingSource) {
        isSyncingPreview = true;
        const ratio = this.previewPane.scrollTop / (this.previewPane.scrollHeight - this.previewPane.clientHeight || 1);
        this.sourceTextarea.scrollTop = ratio * (this.sourceTextarea.scrollHeight - this.sourceTextarea.clientHeight);
        setTimeout(() => { isSyncingPreview = false; }, 50);
      }
      this.updateActiveTocHeading();
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const isEditorFocused = document.activeElement === this.sourceTextarea;
      
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        this.handleNewFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        this.handleSaveFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's' && e.shiftKey) {
        e.preventDefault();
        this.handleSaveFileAs();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'o' && !e.shiftKey) {
        e.preventDefault();
        this.handleOpenFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'o' && e.shiftKey) {
        e.preventDefault();
        this.handleOpenFolder();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (this.activeTabId) this.closeTab(this.activeTabId);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.reloadActiveTab();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.openFindBar();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        if (!isEditorFocused) {
          e.preventDefault();
          this.toggleSidebar();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.exportToPdf();
      } else if (isCmdOrCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        this.changeZoom(0.1);
      } else if (isCmdOrCtrl && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        this.changeZoom(-0.1);
      } else if (isCmdOrCtrl && e.key === '0') {
        e.preventDefault();
        this.resetZoom();
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        this.setViewMode('preview');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        this.setViewMode('split');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        this.setViewMode('source');
      } else if (e.key === 'F1') {
        e.preventDefault();
        this.shortcutsModal.classList.add('visible');
      } else if (e.key === 'Escape') {
        this.shortcutsModal.classList.remove('visible');
        this.lightboxModal.classList.remove('visible');
        this.closeFindBar();
      }
    });
  }

  setupIpcListeners() {
    // Handle CLI arguments
    window.electronAPI.onCliOpenTargets((targets) => {
      if (Array.isArray(targets)) {
        targets.forEach(target => {
          if (this.isMarkdownPath(target)) {
            this.openFile(target);
          } else {
            this.loadFolder(target, true, true);
          }
        });
      }
    });

    // Handle File Changed Event (Live Watch)
    window.electronAPI.onFileChanged(({ event, filePath }) => {
      const tab = this.tabs.find(t => t.filePath === filePath);
      if (tab) {
        if (event === 'change') {
          this.reloadTab(tab.id, true);
        } else if (event === 'unlink') {
          console.warn('File was deleted from disk:', filePath);
        }
      }
    });

    // Native Menu Actions
    window.electronAPI.onMenuAction('new-file', () => this.handleNewFile());
    window.electronAPI.onMenuAction('open-file', () => this.handleOpenFile());
    window.electronAPI.onMenuAction('save-file', () => this.handleSaveFile());
    window.electronAPI.onMenuAction('save-file-as', () => this.handleSaveFileAs());
    window.electronAPI.onMenuAction('open-folder', () => this.handleOpenFolder());
    window.electronAPI.onMenuAction('close-tab', () => this.activeTabId && this.closeTab(this.activeTabId));
    window.electronAPI.onMenuAction('reload-file', () => this.reloadActiveTab());
    window.electronAPI.onMenuAction('export-html', () => this.exportToHtml());
    window.electronAPI.onMenuAction('export-pdf', () => this.exportToPdf());
    window.electronAPI.onMenuAction('find', () => this.openFindBar());
    window.electronAPI.onMenuAction('toggle-sidebar', () => this.toggleSidebar());
    window.electronAPI.onMenuAction('toggle-toc', () => {
      if (this.isSidebarCollapsed) this.toggleSidebar(true);
      this.switchSidebarTab('toc');
    });
    window.electronAPI.onMenuAction('set-view-mode', (mode) => this.setViewMode(mode));
    window.electronAPI.onMenuAction('zoom-in', () => this.changeZoom(0.1));
    window.electronAPI.onMenuAction('zoom-out', () => this.changeZoom(-0.1));
    window.electronAPI.onMenuAction('zoom-reset', () => this.resetZoom());
    window.electronAPI.onMenuAction('show-shortcuts', () => this.shortcutsModal.classList.add('visible'));
    window.electronAPI.onMenuAction('open-sample', () => this.openSampleDocument());
  }

  // ---------------- File & Tab Operations ----------------

  async handleOpenFile() {
    const currentTab = this.tabs.find(t => t.id === this.activeTabId);
    const preferredDir = currentTab ? currentTab.dirName : this.currentFolder;
    const filePath = await window.electronAPI.openFileDialog(preferredDir);
    if (filePath) {
      this.openFile(filePath);
    }
  }

  async openFile(filePath) {
    if (!filePath) return;
    
    // Check if already open
    const existing = this.tabs.find(t => t.filePath === filePath);
    if (existing) {
      this.switchTab(existing.id);
      return;
    }

    const res = await window.electronAPI.readFile(filePath);
    if (!res.success) {
      alert(`Não foi possível abrir o arquivo:\n${res.error}`);
      return;
    }

    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newTab = {
      id: tabId,
      filePath: res.filePath,
      fileName: res.fileName,
      dirName: res.dirName,
      content: res.content,
      savedContent: res.content,
      isDirty: false,
      scrollPos: 0
    };

    this.tabs.push(newTab);
    this.createTabElement(newTab);
    this.switchTab(tabId);

    // Watch file
    window.electronAPI.watchFile(res.filePath);
    this.renderRecentFiles();
  }

  createTabElement(tab) {
    const tabEl = document.createElement('div');
    tabEl.className = `tab-item ${tab.isDirty ? 'dirty' : ''}`;
    tabEl.id = `tab-el-${tab.id}`;
    tabEl.title = tab.filePath || tab.fileName;

    const titleEl = document.createElement('span');
    titleEl.className = 'tab-title';
    titleEl.textContent = tab.fileName;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Fechar Aba (Ctrl+W)';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });

    tabEl.appendChild(titleEl);
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener('click', () => this.switchTab(tab.id));

    this.tabsBar.insertBefore(tabEl, this.btnTabAdd);
  }

  switchTab(tabId) {
    // Save current scroll position
    const currentTab = this.tabs.find(t => t.id === this.activeTabId);
    if (currentTab) {
      currentTab.scrollPos = this.previewPane.scrollTop;
      const currentTabEl = document.getElementById(`tab-el-${currentTab.id}`);
      if (currentTabEl) currentTabEl.classList.remove('active');
    }

    const targetTab = this.tabs.find(t => t.id === tabId);
    if (!targetTab) return;

    this.activeTabId = tabId;
    const targetTabEl = document.getElementById(`tab-el-${targetTab.id}`);
    if (targetTabEl) targetTabEl.classList.add('active');

    // Update tabs visibility
    this.updateTabsVisibility();

    // Update Source Textarea
    this.sourceTextarea.value = targetTab.content;

    // Render Markdown
    this.renderMarkdown(targetTab);

    // Restore scroll position
    setTimeout(() => {
      this.previewPane.scrollTop = targetTab.scrollPos || 0;
    }, 10);

    // Update window title & status
    document.title = `${targetTab.isDirty ? '● ' : ''}${targetTab.fileName} - MDViewer`;
    this.statusFilePath.textContent = targetTab.filePath || 'Sem Título (Não Salvo)';
    if (targetTab.filePath) {
      this.syncFolderWithActiveFile(targetTab.filePath);
    }
  }

  async closeTab(tabId) {
    const tabIdx = this.tabs.findIndex(t => t.id === tabId);
    if (tabIdx === -1) return;

    const tab = this.tabs[tabIdx];
    if (tab.isDirty) {
      // 0: Salvar, 1: Não Salvar, 2: Cancelar
      const choice = await window.electronAPI.confirmUnsaved(tab.fileName);
      if (choice === 2) {
        return; // Cancelado
      }
      if (choice === 0) {
        const saved = await this.saveTab(tab);
        if (!saved) return;
      }
    }

    if (tab.filePath) {
      window.electronAPI.unwatchFile(tab.filePath);
    }

    // Remove Tab DOM
    const tabEl = document.getElementById(`tab-el-${tab.id}`);
    if (tabEl) tabEl.remove();

    this.tabs.splice(tabIdx, 1);

    if (this.tabs.length === 0) {
      this.activeTabId = null;
      this.updateTabsVisibility();
      this.markdownContainer.innerHTML = '';
      this.sourceTextarea.value = '';
      this.tocContainer.innerHTML = '<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum cabeçalho encontrado.</p>';
      this.statusFilePath.textContent = 'Nenhum arquivo';
      this.statusStats.textContent = '0 palavras • 0 linhas';
      this.statusReadTime.textContent = '1 min de leitura';
      document.title = 'MDViewer';
      this.updateActiveTreeItem(null);
    } else if (this.activeTabId === tabId) {
      const nextTab = this.tabs[Math.max(0, tabIdx - 1)];
      this.switchTab(nextTab.id);
    }
  }

  async reloadTab(tabId, preserveScroll = true) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;
    if (tab.isDirty) {
      console.warn('Skipping auto-reload because tab has unsaved changes:', tab.filePath);
      return;
    }

    const savedScroll = this.previewPane.scrollTop;
    const res = await window.electronAPI.readFile(tab.filePath);
    if (res.success) {
      tab.content = res.content;
      tab.savedContent = res.content;
      this.updateTabDirty(tab, false);
      if (this.activeTabId === tabId) {
        this.sourceTextarea.value = tab.content;
        this.renderMarkdown(tab);
        if (preserveScroll) {
          setTimeout(() => { this.previewPane.scrollTop = savedScroll; }, 10);
        }
      }
    }
  }

  reloadActiveTab() {
    if (this.activeTabId) {
      this.reloadTab(this.activeTabId, true);
    }
  }

  // ---------------- Editor & Document Management ----------------

  handleNewFile() {
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newTab = {
      id: tabId,
      filePath: null,
      fileName: 'Sem Título.md',
      dirName: this.currentFolder || null,
      content: '# Novo Documento\n\nComece a escrever aqui...\n',
      savedContent: '',
      isDirty: true,
      scrollPos: 0
    };

    this.tabs.push(newTab);
    this.createTabElement(newTab);
    this.switchTab(tabId);

    // If in preview mode, switch to split mode so editor is immediately visible
    if (this.viewMode === 'preview') {
      this.setViewMode('split');
    }
    this.sourceTextarea.focus();
    this.sourceTextarea.setSelectionRange(this.sourceTextarea.value.length, this.sourceTextarea.value.length);
  }

  async handleSaveFile() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;
    return await this.saveTab(activeTab);
  }

  async handleSaveFileAs() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;
    return await this.saveTabAs(activeTab);
  }

  async saveTab(tab) {
    if (!tab) return false;
    if (!tab.filePath) {
      return await this.saveTabAs(tab);
    }

    const res = await window.electronAPI.saveFile(tab.filePath, tab.content);
    if (res.success) {
      tab.savedContent = tab.content;
      this.updateTabDirty(tab, false);
      this.showSaveFeedback('Salvo!');
      return true;
    } else {
      alert(`Erro ao salvar arquivo:\n${res.error}`);
      return false;
    }
  }

  async saveTabAs(tab) {
    if (!tab) return false;
    const defaultDir = tab.dirName || this.currentFolder;
    const defaultName = tab.fileName || 'documento.md';
    const res = await window.electronAPI.saveFileAs(tab.content, defaultName, defaultDir);

    if (res && res.success) {
      tab.filePath = res.filePath;
      tab.fileName = res.fileName;
      tab.dirName = res.dirName;
      tab.savedContent = tab.content;
      this.updateTabDirty(tab, false);

      const tabEl = document.getElementById(`tab-el-${tab.id}`);
      if (tabEl) {
        const titleEl = tabEl.querySelector('.tab-title');
        if (titleEl) titleEl.textContent = tab.fileName;
        tabEl.title = tab.filePath;
      }

      if (this.activeTabId === tab.id) {
        document.title = `${tab.fileName} - MDViewer`;
        this.statusFilePath.textContent = tab.filePath;
      }

      window.electronAPI.watchFile(tab.filePath);
      this.renderRecentFiles();
      this.showSaveFeedback('Salvo!');
      return true;
    }
    return false;
  }

  updateTabDirty(tab, isDirty) {
    tab.isDirty = isDirty;
    const tabEl = document.getElementById(`tab-el-${tab.id}`);
    if (tabEl) {
      tabEl.classList.toggle('dirty', isDirty);
    }
    if (this.activeTabId === tab.id) {
      document.title = `${isDirty ? '● ' : ''}${tab.fileName} - MDViewer`;
    }
  }

  handleEditorInput() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;

    activeTab.content = this.sourceTextarea.value;
    const isDirty = activeTab.content !== activeTab.savedContent;
    if (activeTab.isDirty !== isDirty) {
      this.updateTabDirty(activeTab, isDirty);
    }

    clearTimeout(this.renderDebounceTimer);
    this.renderDebounceTimer = setTimeout(() => {
      this.renderMarkdown(activeTab);
    }, 150);
  }

  toggleTaskCheckbox(taskIndex, isChecked) {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
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

  async openSampleDocument() {
    const samplePath = await window.electronAPI.getSamplePath();
    if (samplePath) {
      this.openFile(samplePath);
    }
  }

  // ---------------- Markdown Rendering & Processing ----------------

  renderMarkdown(tab) {
    const parsed = window.electronAPI.parseMarkdown(tab.content);
    
    // Inject HTML (Sanitized to prevent XSS)
    const sanitizedHtml = DOMPurify.sanitize(parsed.html, {
      ADD_TAGS: ['svg', 'path', 'figure', 'figcaption'],
      ADD_ATTR: ['data-code', 'data-line', 'data-local-path', 'viewBox', 'fill', 'd']
    });
    this.markdownContainer.innerHTML = sanitizedHtml;
    this.headings = parsed.headings || [];

    // Attach heading anchor copy link
    const headingAnchors = this.markdownContainer.querySelectorAll('.heading-anchor');
    headingAnchors.forEach(anchor => {
      anchor.addEventListener('click', () => {
        const id = anchor.parentElement.id;
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#' + id);
      });
    });

    // Update Status Bar
    if (parsed.stats) {
      this.statusStats.textContent = `${parsed.stats.words.toLocaleString()} palavras • ${parsed.stats.lines} linhas`;
      this.statusReadTime.textContent = `${parsed.stats.readTimeMinutes} min de leitura`;
    }

    // Resolve relative images & add lightbox
    const images = this.markdownContainer.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('file://')) {
        // Resolve relative to markdown file directory
        img.src = `file://${tab.dirName}/${src}`;
      }
      img.addEventListener('click', () => {
        this.lightboxImg.src = img.src;
        this.lightboxModal.classList.add('visible');
      });
    });

    // Setup Copy Code buttons
    const copyButtons = this.markdownContainer.querySelectorAll('.copy-code-button');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rawCode = decodeURIComponent(btn.dataset.code || '');
        navigator.clipboard.writeText(rawCode).then(() => {
          btn.classList.add('copied');
          btn.querySelector('.copy-text').textContent = 'Copiado!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('.copy-text').textContent = 'Copiar';
          }, 1500);
        });
      });
    });

    // Intercept internal & external links
    const links = this.markdownContainer.querySelectorAll('a');
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          window.electronAPI.openExternal(href);
        });
      } else if (href && href.startsWith('#')) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } else if (a.dataset.localPath) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const localTarget = a.dataset.localPath;
          let fullTarget = (localTarget.startsWith('/') || !tab.dirName) ? localTarget : `${tab.dirName}/${localTarget}`;
          if (fullTarget.includes('#')) {
            fullTarget = fullTarget.split('#')[0];
          }
          this.openFile(fullTarget);
        });
      }
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

    // Render Mermaid diagrams
    if (window.mermaid) {
      try {
        const mermaidEls = this.markdownContainer.querySelectorAll('.mermaid');
        if (mermaidEls.length > 0) {
          window.mermaid.run({ nodes: mermaidEls });
        }
      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err);
      }
    }

    // Render TOC
    this.renderToc(this.headings);
  }

  // ---------------- Table of Contents (TOC) ----------------

  renderToc(headings) {
    if (!headings || headings.length === 0) {
      this.tocContainer.innerHTML = '<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum cabeçalho encontrado.</p>';
      return;
    }

    const list = document.createElement('ul');
    list.className = 'toc-list';

    headings.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = `toc-item toc-level-${h.level}`;
      a.dataset.targetId = h.id;
      a.textContent = h.text;
      a.title = h.text;

      a.addEventListener('click', () => {
        const el = document.getElementById(h.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      });

      li.appendChild(a);
      list.appendChild(li);
    });

    this.tocContainer.innerHTML = '';
    this.tocContainer.appendChild(list);
  }

  updateActiveTocHeading() {
    if (!this.headings || this.headings.length === 0) return;
    const scrollPos = this.previewPane.scrollTop + 100;
    
    let activeId = null;
    for (let i = 0; i < this.headings.length; i++) {
      const el = document.getElementById(this.headings[i].id);
      if (el && el.offsetTop <= scrollPos) {
        activeId = this.headings[i].id;
      }
    }

    const tocItems = this.tocContainer.querySelectorAll('.toc-item');
    tocItems.forEach(item => {
      if (item.dataset.targetId === activeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ---------------- File Explorer & Folder Navigation ----------------

  async handleOpenFolder() {
    const currentTab = this.tabs.find(t => t.id === this.activeTabId);
    const preferredDir = this.currentFolder || (currentTab ? currentTab.dirName : null);
    const folderPath = await window.electronAPI.openFolderDialog(preferredDir);
    if (folderPath) {
      this.loadFolder(folderPath);
    }
  }

  async loadFolder(folderPath, activateSidebar = true, autoOpenFile = true) {
    const res = await window.electronAPI.readDir(folderPath);
    if (!res.success) {
      console.error('Error reading directory:', res.error);
      return;
    }

    this.currentFolder = res.dirPath;
    this.currentTree = res.tree;
    this.explorerFolderName.textContent = res.dirName;
    this.explorerFolderName.title = res.dirPath;

    this.renderFileTree(this.currentTree);

    if (activateSidebar) {
      if (this.isSidebarCollapsed) this.toggleSidebar(true);
      this.switchSidebarTab('explorer');
    }

    // Auto-open first markdown file if enabled and no tab is currently open
    if (autoOpenFile && this.tabs.length === 0 && this.currentTree.length > 0) {
      const findFirstMd = (nodes) => {
        for (const node of nodes) {
          if (!node.isDirectory && node.isMarkdown) return node.path;
          if (node.isDirectory && node.children) {
            const found = findFirstMd(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const firstMd = findFirstMd(this.currentTree);
      if (firstMd) {
        this.openFile(firstMd);
      }
    }
  }

  async handleInitialTargets() {
    try {
      const targets = this.pendingInitialTargets || await window.electronAPI.getInitialTargets();
      this.pendingInitialTargets = null;
      if (Array.isArray(targets) && targets.length > 0) {
        for (const target of targets) {
          if (this.isMarkdownPath(target)) {
            await this.openFile(target);
          } else {
            await this.loadFolder(target, true, true);
          }
        }
      }
    } catch (e) {
      console.error('Error handling initial targets:', e);
    }
  }

  isMarkdownPath(filePath) {
    if (!filePath || typeof filePath !== 'string') return false;
    const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
    return ['.md', '.markdown', '.mdown', '.mkd', '.mdx', '.txt'].includes(ext);
  }

  async syncFolderWithActiveFile(filePath) {
    if (!filePath) return;

    const isInsideCurrent = this.isPathInsideCurrentFolder(filePath);

    if (!isInsideCurrent) {
      const parentDir = this.getParentDirectory(filePath);
      if (parentDir) {
        await this.loadFolder(parentDir, false, false);
      }
    }

    this.updateActiveTreeItem(filePath);
  }

  isPathInsideCurrentFolder(filePath) {
    if (!this.currentFolder || !filePath) return false;
    const folder = this.currentFolder.replace(/[/\\]+$/, '');
    return filePath === folder || filePath.startsWith(folder + '/') || filePath.startsWith(folder + '\\');
  }

  getParentDirectory(filePath) {
    if (!filePath) return null;
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    if (lastSlash <= 0) return null;
    return filePath.slice(0, lastSlash);
  }

  updateActiveTreeItem(activeFilePath) {
    if (!this.fileTreeContainer) return;
    if (!activeFilePath) {
      const activeItems = this.fileTreeContainer.querySelectorAll('.tree-item.active');
      activeItems.forEach(item => item.classList.remove('active'));
      return;
    }

    let targetItem = null;
    const treeItems = this.fileTreeContainer.querySelectorAll('.tree-item');
    treeItems.forEach(item => {
      if (item.dataset.path === activeFilePath) {
        item.classList.add('active');
        targetItem = item;
      } else {
        item.classList.remove('active');
      }
    });

    if (targetItem) {
      // Expand all parent folders if collapsed
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

      // Scroll into view
      setTimeout(() => {
        targetItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }
  }

  renderFileTree(tree, parentEl = null, defaultCollapsed = true) {
    const target = parentEl || this.fileTreeContainer;
    if (!parentEl) target.innerHTML = '';

    const ul = document.createElement('ul');
    ul.className = parentEl ? (defaultCollapsed ? 'tree-folder-children collapsed' : 'tree-folder-children') : 'file-tree';

    tree.forEach(item => {
      const li = document.createElement('li');
      const itemRow = document.createElement('div');
      itemRow.dataset.path = item.path;

      if (item.isDirectory) {
        itemRow.className = 'tree-item tree-folder' + (defaultCollapsed ? '' : ' expanded');
        const hasChildren = item.children && item.children.length > 0;

        itemRow.innerHTML = `
          <span class="tree-arrow ${hasChildren ? '' : 'empty'}">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </span>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="#58a6ff"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>
          <span class="tree-item-name" style="font-weight: 500;">${item.name}</span>
        `;
        li.appendChild(itemRow);

        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          this.renderFileTree(item.children, childrenContainer, defaultCollapsed);
          li.appendChild(childrenContainer.firstElementChild);

          itemRow.addEventListener('click', () => {
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
        const isMd = item.isMarkdown;
        const iconSvg = isMd
          ? `<svg viewBox="0 0 16 16" width="14" height="14" fill="#3fb950"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586a1.75 1.75 0 0 1 1.237.513l2.914 2.914c.328.328.513.774.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.06v2.69c0 .138.112.25.25.25h2.69Z"/></svg>`
          : `<svg viewBox="0 0 16 16" width="14" height="14" fill="var(--text-muted)"><path d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v12.5A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25ZM3.75 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Z"/></svg>`;

        itemRow.className = 'tree-item tree-file';
        itemRow.innerHTML = `
          <span class="tree-arrow-spacer"></span>
          ${iconSvg}
          <span class="tree-item-name">${item.name}</span>
        `;
        itemRow.title = item.path;

        itemRow.addEventListener('click', () => {
          if (isMd) {
            this.openFile(item.path);
          }
        });

        // Highlight if already open
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.filePath === item.path) {
          itemRow.classList.add('active');
        }

        li.appendChild(itemRow);
      }

      ul.appendChild(li);
    });

    target.appendChild(ul);
  }

  filterFileTree(query) {
    if (!query) {
      this.renderFileTree(this.currentTree, null, true);
      const activeTab = this.tabs.find(t => t.id === this.activeTabId);
      if (activeTab) {
        this.updateActiveTreeItem(activeTab.filePath);
      }
      return;
    }
    const q = query.toLowerCase();

    function filterNodes(nodes) {
      const result = [];
      for (const node of nodes) {
        if (node.isDirectory) {
          const matchingChildren = filterNodes(node.children || []);
          if (matchingChildren.length > 0 || node.name.toLowerCase().includes(q)) {
            result.push({ ...node, children: matchingChildren });
          }
        } else if (node.name.toLowerCase().includes(q)) {
          result.push(node);
        }
      }
      return result;
    }

    const filtered = filterNodes(this.currentTree);
    this.renderFileTree(filtered, null, false);
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (activeTab) {
      this.updateActiveTreeItem(activeTab.filePath);
    }
  }

  // ---------------- Recent Files ----------------

  async renderRecentFiles() {
    const settings = await window.electronAPI.getSettings();
    const recents = settings.recentFiles || [];
    this.recentFilesList.innerHTML = '';

    if (recents.length === 0) {
      this.recentFilesList.innerHTML = '<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhum arquivo recente.</p>';
      return;
    }

    recents.forEach(filePath => {
      const fileName = filePath.split('/').pop();
      const li = document.createElement('li');
      li.className = 'recent-item';

      li.innerHTML = `
        <div class="recent-info">
          <span class="recent-name">${fileName}</span>
          <span class="recent-path">${filePath}</span>
        </div>
        <button class="recent-remove-btn" title="Remover dos recentes">✕</button>
      `;

      li.addEventListener('click', (e) => {
        if (!e.target.classList.contains('recent-remove-btn')) {
          this.openFile(filePath);
        }
      });

      const removeBtn = li.querySelector('.recent-remove-btn');
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await window.electronAPI.removeRecentFile(filePath);
        this.renderRecentFiles();
      });

      this.recentFilesList.appendChild(li);
    });
  }

  // ---------------- View Mode, Sidebar & Zoom ----------------

  setViewMode(mode) {
    this.viewMode = mode;
    this.appContentWrapper.classList.remove('mode-preview', 'mode-split', 'mode-source');
    this.appContentWrapper.classList.add(`mode-${mode}`);
    
    this.btnViewPreview.classList.toggle('active', mode === 'preview');
    this.btnViewSplit.classList.toggle('active', mode === 'split');
    this.btnViewSource.classList.toggle('active', mode === 'source');
    
    this.updateTabsVisibility();
    this.saveSettings();
  }

  updateTabsVisibility() {
    const hasTabs = Boolean(this.tabs && this.tabs.length > 0);
    if (this.viewportContainer) {
      this.viewportContainer.classList.toggle('has-tabs', hasTabs);
    }
    if (this.appContentWrapper) {
      this.appContentWrapper.classList.toggle('has-tabs', hasTabs);
    }

    if (!hasTabs) {
      if (this.welcomeScreen) this.welcomeScreen.style.display = 'flex';
      if (this.sourcePane) this.sourcePane.style.display = 'none';
      if (this.previewPane) this.previewPane.style.display = 'none';
    } else {
      if (this.welcomeScreen) this.welcomeScreen.style.display = 'none';
      if (this.viewMode === 'preview') {
        if (this.previewPane) this.previewPane.style.display = 'block';
        if (this.sourcePane) this.sourcePane.style.display = 'none';
      } else if (this.viewMode === 'source') {
        if (this.previewPane) this.previewPane.style.display = 'none';
        if (this.sourcePane) this.sourcePane.style.display = 'flex';
      } else { // split
        if (this.previewPane) this.previewPane.style.display = 'block';
        if (this.sourcePane) this.sourcePane.style.display = 'flex';
      }
    }
  }

  setTheme(themeName, save = true) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.themeSelector.value = themeName;
    
    // Re-init Mermaid with matching theme
    this.initMermaid();
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (activeTab) {
      this.renderMarkdown(activeTab);
    }

    if (save) this.saveSettings();
  }

  changeZoom(delta) {
    this.zoomLevel = Math.max(0.6, Math.min(2.5, Math.round((this.zoomLevel + delta) * 10) / 10));
    this.applyZoom();
  }

  applyZoom() {
    this.markdownContainer.style.zoom = this.zoomLevel;
    this.sourceTextarea.style.fontSize = `${0.9 * this.zoomLevel}rem`;
    this.zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    this.saveSettings();
  }

  // ---------------- Find in Page (Ctrl+F) ----------------

  openFindBar() {
    this.findBar.classList.add('visible');
    this.findInput.focus();
    this.findInput.select();
    if (this.findInput.value) {
      this.performFind(this.findInput.value);
    }
  }

  clearFindHighlights() {
    const highlights = this.markdownContainer.querySelectorAll('mark.search-highlight');
    highlights.forEach(h => {
      const parent = h.parentNode;
      parent.replaceChild(document.createTextNode(h.textContent), h);
      parent.normalize();
    });
    this.findMatches = [];
    this.currentFindIndex = -1;
    this.findCount.textContent = '0 / 0';
  }

  performFind(query) {
    this.clearFindHighlights();
    if (!query || query.trim() === '') return;

    const walker = document.createTreeWalker(
      this.markdownContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      nodes.push(currentNode);
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    nodes.forEach(node => {
      const matches = [...node.nodeValue.matchAll(regex)];
      if (matches.length > 0) {
        const frag = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach(match => {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;

          if (matchStart > lastIndex) {
            frag.appendChild(document.createTextNode(node.nodeValue.substring(lastIndex, matchStart)));
          }

          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = match[0];
          frag.appendChild(mark);
          this.findMatches.push(mark);

          lastIndex = matchEnd;
        });

        if (lastIndex < node.nodeValue.length) {
          frag.appendChild(document.createTextNode(node.nodeValue.substring(lastIndex)));
        }

        node.parentNode.replaceChild(frag, node);
      }
    });

    if (this.findMatches.length > 0) {
      this.currentFindIndex = 0;
      this.highlightCurrentMatch();
    } else {
      this.findCount.textContent = '0 / 0';
    }
  }

  highlightCurrentMatch() {
    this.findMatches.forEach((m, idx) => {
      m.classList.toggle('active-match', idx === this.currentFindIndex);
    });

    this.findCount.textContent = `${this.currentFindIndex + 1} / ${this.findMatches.length}`;

    const currentEl = this.findMatches[this.currentFindIndex];
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  findNext() {
    if (this.findMatches.length === 0) return;
    this.currentFindIndex = (this.currentFindIndex + 1) % this.findMatches.length;
    this.highlightCurrentMatch();
  }

  findPrevious() {
    if (this.findMatches.length === 0) return;
    this.currentFindIndex = (this.currentFindIndex - 1 + this.findMatches.length) % this.findMatches.length;
    this.highlightCurrentMatch();
  }

  // ---------------- Exporting ----------------

  async exportToPdf() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    const defaultName = activeTab ? activeTab.fileName.replace(/\.[^/.]+$/, '') + '.pdf' : 'documento.pdf';
    const preferredDir = activeTab ? activeTab.dirName : this.currentFolder;
    await window.electronAPI.exportPdf({ defaultName, defaultDir: preferredDir });
  }

  async exportToHtml() {
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;

    const defaultName = activeTab.fileName.replace(/\.[^/.]+$/, '') + '.html';
    const preferredDir = activeTab.dirName || this.currentFolder;
    const parsed = window.electronAPI.parseMarkdown(activeTab.content);

    // Get current theme styles
    const themeName = document.documentElement.getAttribute('data-theme') || 'github-dark';

    // Standalone HTML template with all inline styling
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="${themeName}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeTab.fileName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css">
  <style>
    body {
      background-color: var(--bg-primary, #0d1117);
      color: var(--text-primary, #e6edf3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .markdown-body {
      max-width: 900px;
      margin: 0 auto;
      line-height: 1.6;
    }
    pre { background: #161b22; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #30363d; }
    code { font-family: monospace; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #30363d; padding: 8px 12px; }
    th { background: #161b22; }
    blockquote { border-left: 4px solid #30363d; padding-left: 16px; color: #8b949e; margin: 0; }
    .markdown-alert { border-left: 4px solid; padding: 12px 16px; margin: 16px 0; border-radius: 6px; background: rgba(255,255,255,0.05); }
    .markdown-alert-note { border-color: #58a6ff; }
    .markdown-alert-tip { border-color: #3fb950; }
    .markdown-alert-important { border-color: #bc8cff; }
    .markdown-alert-warning { border-color: #d29922; }
    .markdown-alert-caution { border-color: #ff7b72; }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${parsed.html}
  </div>
</body>
</html>`;

    await window.electronAPI.exportHtml({ defaultName, htmlContent: fullHtml, defaultDir: preferredDir });
  }
}

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MDViewerApp();
});
