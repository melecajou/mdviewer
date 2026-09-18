class MDViewerBase {
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

  formatWrap(before, after, defaultText = 'texto') {
    const textarea = this.sourceTextarea;
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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MDViewerBase;
}
