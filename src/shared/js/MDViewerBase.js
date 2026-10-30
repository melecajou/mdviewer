class MDViewerBase {
  static escapeHtml(unsafe) {
    return (unsafe || '').toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  escapeHtml(unsafe) {
    return MDViewerBase.escapeHtml(unsafe);
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

  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.settings = {};
    this.zoomLevel = 1.0;
    this.viewMode = 'preview'; // 'preview' | 'split' | 'source'
    this.isSidebarCollapsed = false;
    this.currentFolder = null;
    this.currentTree = [];
    this.headings = [];
    this.findMatches = [];
    this.currentFindIndex = -1;
    this.renderDebounceTimer = null;
    this.isSyncingScroll = false;
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  initMermaid() {
    if (window.mermaid) {
      const isDark = !document.documentElement.getAttribute('data-theme')?.includes('light');
      window.mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'strict',
        flowchart: { htmlLabels: true, curve: 'basis' }
      });
    }
  }

  showSaveFeedback(text = 'Salvo!') {
    const span = this.btnSaveFile?.querySelector('span');
    if (span) {
      const orig = span.textContent;
      span.textContent = text;
      this.btnSaveFile.style.color = '#3fb950';
      setTimeout(() => {
        span.textContent = orig;
        this.btnSaveFile.style.color = '';
      }, 1500);
    }
  }

  handleEditorKeydown(e) {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;

    if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      this.formatWrap('**', '**', 'negrito');
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      this.formatWrap('*', '*', 'itálico');
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.formatLink();
    } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      this.formatCodeBlock();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.handleTabKey(e.shiftKey);
    } else if (e.key === 'Enter') {
      this.handleEnterKey(e);
    }
  }

  handleTabKey(isShift) {
    const textarea = this.sourceTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    if (start === end && !isShift) {
      this.insertTextAtCursor('  ');
      return;
    }

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', end);
    const block = val.substring(lineStart, lineEnd === -1 ? val.length : lineEnd);
    const lines = block.split('\n');

    let newLines;
    if (isShift) {
      newLines = lines.map(l => l.startsWith('  ') ? l.substring(2) : (l.startsWith(' ') ? l.substring(1) : l));
    } else {
      newLines = lines.map(l => '  ' + l);
    }

    textarea.setSelectionRange(lineStart, lineEnd === -1 ? val.length : lineEnd);
    this.insertTextAtCursor(newLines.join('\n'));
  }

  toggleComment() {
    const textarea = this.sourceTextarea;
    if (!textarea) return;
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', end);
    const block = val.substring(lineStart, lineEnd === -1 ? val.length : lineEnd);
    const lines = block.split('\n');

    const allCommented = lines.every(l => l.startsWith('<!-- ') && l.endsWith(' -->'));
    const newLines = lines.map(l => {
      if (allCommented) {
        return l.substring(5, l.length - 4);
      } else {
        return `<!-- ${l} -->`;
      }
    });

    textarea.setSelectionRange(lineStart, lineEnd === -1 ? val.length : lineEnd);
    this.insertTextAtCursor(newLines.join('\n'));
  }

  handleEnterKey(e) {
    const textarea = this.sourceTextarea;
    const start = textarea.selectionStart;
    const val = textarea.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const currentLine = val.substring(lineStart, start);

    const taskMatch = currentLine.match(/^(\s*)(- \[[ xX]\]\s+)(.*)/);
    const bulletMatch = currentLine.match(/^(\s*)([-*+]\s+)(.*)/);
    const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)/);

    if (taskMatch) {
      e.preventDefault();
      if (taskMatch[3].trim() === '') {
        textarea.setSelectionRange(lineStart, start);
        this.insertTextAtCursor('');
      } else {
        this.insertTextAtCursor('\n' + taskMatch[1] + '- [ ] ');
      }
    } else if (bulletMatch) {
      e.preventDefault();
      if (bulletMatch[3].trim() === '') {
        textarea.setSelectionRange(lineStart, start);
        this.insertTextAtCursor('');
      } else {
        this.insertTextAtCursor('\n' + bulletMatch[1] + bulletMatch[2]);
      }
    } else if (numberMatch) {
      e.preventDefault();
      if (numberMatch[3].trim() === '') {
        textarea.setSelectionRange(lineStart, start);
        this.insertTextAtCursor('');
      } else {
        const nextNum = parseInt(numberMatch[2], 10) + 1;
        this.insertTextAtCursor('\n' + numberMatch[1] + nextNum + '. ');
      }
    }
  }

  insertTextAtCursor(text, selectOffset = 0, selectLength = 0) {
    const textarea = this.sourceTextarea;
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      const val = textarea.value;
      textarea.value = val.substring(0, start) + text + val.substring(end);
      textarea.selectionStart = start + text.length;
      textarea.selectionEnd = start + text.length;
    }

    if (selectLength > 0) {
      textarea.selectionStart = start + selectOffset;
      textarea.selectionEnd = start + selectOffset + selectLength;
    } else if (selectOffset > 0) {
      textarea.selectionStart = start + selectOffset;
      textarea.selectionEnd = start + selectOffset;
    }

    this.handleEditorInput();
  }

  insertMarkdown(before, after, defaultText = '') {
    const textarea = this.sourceTextarea;
    if (!textarea) return;
    this.formatWrap(before, after, defaultText);
  }

  formatWrap(before, after, defaultText = 'texto') {
    const textarea = this.sourceTextarea;
    if (!textarea) return;
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selectedText = val.substring(start, end);

    if (selectedText.length > 0) {
      if (
        val.substring(start - before.length, start) === before &&
        val.substring(end, end + after.length) === after
      ) {
        textarea.selectionStart = start - before.length;
        textarea.selectionEnd = end + after.length;
        this.insertTextAtCursor(selectedText, 0, selectedText.length);
        return;
      }
      const replacement = `${before}${selectedText}${after}`;
      this.insertTextAtCursor(replacement, before.length, selectedText.length);
    } else {
      const replacement = `${before}${defaultText}${after}`;
      this.insertTextAtCursor(replacement, before.length, defaultText.length);
    }
  }

  formatHeading() {
    const textarea = this.sourceTextarea;
    textarea.focus();
    const start = textarea.selectionStart;
    const val = textarea.value;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', start);
    const currentLine = val.substring(lineStart, lineEnd === -1 ? val.length : lineEnd);

    let newLine = '';
    if (currentLine.startsWith('### ')) {
      newLine = currentLine.substring(4);
    } else if (currentLine.startsWith('## ')) {
      newLine = '### ' + currentLine.substring(3);
    } else if (currentLine.startsWith('# ')) {
      newLine = '## ' + currentLine.substring(2);
    } else {
      newLine = '# ' + currentLine.replace(/^#+\s*/, '');
    }

    textarea.setSelectionRange(lineStart, lineEnd === -1 ? val.length : lineEnd);
    this.insertTextAtCursor(newLine);
  }

  formatPrefix(prefix) {
    const textarea = this.sourceTextarea;
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', end);
    const block = val.substring(lineStart, lineEnd === -1 ? val.length : lineEnd);
    const lines = block.split('\n');

    const allHavePrefix = lines.every(l => l.startsWith(prefix));
    const newLines = lines.map((l, i) => {
      if (allHavePrefix) {
        return l.substring(prefix.length);
      } else {
        if (prefix === '1. ') {
          return `${i + 1}. ${l.replace(/^(\d+\. |- |\* |\+ |- \[[ xX]\] )\s*/, '')}`;
        }
        return `${prefix}${l.replace(/^(\d+\. |- |\* |\+ |- \[[ xX]\] )\s*/, '')}`;
      }
    });

    textarea.setSelectionRange(lineStart, lineEnd === -1 ? val.length : lineEnd);
    this.insertTextAtCursor(newLines.join('\n'));
  }

  formatLink() {
    const textarea = this.sourceTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end) || 'texto do link';
    this.insertTextAtCursor(`[${text}](https://exemplo.com)`, text.length + 3, 19);
  }

  formatImage() {
    const textarea = this.sourceTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end) || 'legenda';
    this.insertTextAtCursor(`![${text}](caminho/para/imagem.png)`, text.length + 4, 22);
  }

  formatCodeBlock() {
    const textarea = this.sourceTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end) || '// código aqui';
    const snippet = `\`\`\`javascript\n${text}\n\`\`\`\n`;
    this.insertTextAtCursor(snippet, 3, 10);
  }

  formatTable() {
    const snippet = `| Coluna 1 | Coluna 2 | Coluna 3 |\n| :--- | :--- | :--- |\n| Item 1 | Valor A | 100 |\n| Item 2 | Valor B | 200 |\n`;
    this.insertTextAtCursor(snippet);
  }

  toggleSidebar(forceState = null) {
    this.isSidebarCollapsed = forceState !== null ? !forceState : !this.isSidebarCollapsed;
    this.appSidebar.classList.toggle('collapsed', this.isSidebarCollapsed);
    this.saveSettings();
  }

  switchSidebarTab(tabName) {
    this.sidebarTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    this.sidebarPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabName}`);
    });
    this.saveSettings();
  }

  resetZoom() {
    this.zoomLevel = 1.0;
    this.applyZoom();
  }

  closeFindBar() {
    this.findBar.classList.remove('visible');
    this.clearFindHighlights();
  }

  async copyTextContent(text, button = null, originalText = null, successText = 'Copiado!') {
    const { navigator, document } = window;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!successful) {
          throw new Error('execCommand copy failed');
        }
      }

      if (button) {
        const span = button.querySelector('.copy-text') || button;
        const orig = originalText !== null ? originalText : span.textContent;
        span.textContent = successText;
        setTimeout(() => {
          span.textContent = orig;
        }, 1500);
      }
    } catch (err) {
      if (button) {
        const span = button.querySelector('.copy-text') || button;
        const orig = originalText !== null ? originalText : span.textContent;
        span.textContent = 'Erro ao copiar';
        setTimeout(() => {
          span.textContent = orig;
        }, 1500);
      }
    }
  }

  copyToClipboard(text, options = {}) {
    const {
      button = null,
      copiedText = 'Copiado!',
      originalText = null,
      copiedClass = null,
      timeout = 1800
    } = options;

    return navigator.clipboard.writeText(text).then(() => {
      if (button) {
        if (copiedClass) {
          button.classList.add(copiedClass);
        }
        const span = button.querySelector('.copy-text');
        if (span) {
          const orig = originalText !== null ? originalText : span.textContent;
          span.textContent = copiedText;
          setTimeout(() => {
            if (copiedClass) {
              button.classList.remove(copiedClass);
            }
            span.textContent = orig;
          }, timeout);
        } else if (copiedClass) {
          setTimeout(() => {
            button.classList.remove(copiedClass);
          }, timeout);
        }
      }
    });
  }

  createSvg(viewBox, width, height, fill, pathD, className = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (className) svg.setAttribute('class', className);
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('fill', fill);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);
    return svg;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MDViewerBase;
}
