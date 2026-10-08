/**
 * @jest-environment jsdom
 */

const MDViewerBase = require('./MDViewerBase');

describe('MDViewerBase', () => {
  let viewer;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    delete window.mermaid;
    viewer = new MDViewerBase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initMermaid', () => {
    it('should not throw if window.mermaid is undefined', () => {
      expect(() => viewer.initMermaid()).not.toThrow();
    });

    it('should initialize mermaid with dark theme if data-theme is dark or null', () => {
      window.mermaid = {
        initialize: jest.fn()
      };

      // Case 1: data-theme is null (removed above)
      viewer.initMermaid();
      expect(window.mermaid.initialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        flowchart: { htmlLabels: true, curve: 'basis' }
      });

      window.mermaid.initialize.mockClear();

      // Case 2: data-theme is 'dark'
      document.documentElement.setAttribute('data-theme', 'dark');
      viewer.initMermaid();
      expect(window.mermaid.initialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        flowchart: { htmlLabels: true, curve: 'basis' }
      });
    });

    it('should initialize mermaid with default theme if data-theme is light', () => {
      window.mermaid = {
        initialize: jest.fn()
      };

      document.documentElement.setAttribute('data-theme', 'light');
      viewer.initMermaid();

      expect(window.mermaid.initialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
        flowchart: { htmlLabels: true, curve: 'basis' }
      });
    });
  });

  describe('showSaveFeedback', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should set text content to the default "Salvo!", update color, and restore after 1500ms', () => {
      const btn = document.createElement('button');
      const span = document.createElement('span');
      span.textContent = 'Save';
      btn.appendChild(span);
      viewer.btnSaveFile = btn;

      viewer.showSaveFeedback();

      expect(span.textContent).toBe('Salvo!');
      expect(btn.style.color).toBe('rgb(63, 185, 80)');

      jest.advanceTimersByTime(1499);
      expect(span.textContent).toBe('Salvo!');
      expect(btn.style.color).toBe('rgb(63, 185, 80)');

      jest.advanceTimersByTime(1);
      expect(span.textContent).toBe('Save');
      expect(btn.style.color).toBe('');
    });

    it('should set text content to the provided argument, update color, and restore after 1500ms', () => {
      const btn = document.createElement('button');
      const span = document.createElement('span');
      span.textContent = 'Guardar';
      btn.appendChild(span);
      viewer.btnSaveFile = btn;

      viewer.showSaveFeedback('Saved custom!');

      expect(span.textContent).toBe('Saved custom!');
      expect(btn.style.color).toBe('rgb(63, 185, 80)');

      jest.advanceTimersByTime(1500);

      expect(span.textContent).toBe('Guardar');
      expect(btn.style.color).toBe('');
    });

    it('should handle missing this.btnSaveFile gracefully', () => {
      viewer.btnSaveFile = null;

      expect(() => {
        viewer.showSaveFeedback();
      }).not.toThrow();
    });

    it('should handle missing span inside this.btnSaveFile gracefully', () => {
      const btn = document.createElement('button');
      viewer.btnSaveFile = btn;

      expect(() => {
        viewer.showSaveFeedback();
      }).not.toThrow();
    });
  });

  describe('insertTextAtCursor', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();
    });

    it('should insert text at cursor position when no text is selected', () => {
      textarea.value = 'Hello world';
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      viewer.insertTextAtCursor(' beautiful');

      expect(textarea.value).toBe('Hello beautiful world');
      expect(textarea.selectionStart).toBe(15);
      expect(textarea.selectionEnd).toBe(15);
      expect(viewer.handleEditorInput).toHaveBeenCalledTimes(1);
    });

    it('should replace selected text when range is selected', () => {
      textarea.value = 'Hello world';
      textarea.selectionStart = 6;
      textarea.selectionEnd = 11;

      viewer.insertTextAtCursor('there');

      expect(textarea.value).toBe('Hello there');
      expect(textarea.selectionStart).toBe(11);
      expect(textarea.selectionEnd).toBe(11);
      expect(viewer.handleEditorInput).toHaveBeenCalledTimes(1);
    });

    it('should set selectionStart and selectionEnd according to selectOffset and selectLength', () => {
      textarea.value = '';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;

      viewer.insertTextAtCursor('**bold**', 2, 4);

      expect(textarea.value).toBe('**bold**');
      expect(textarea.selectionStart).toBe(2);
      expect(textarea.selectionEnd).toBe(6);
      expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('bold');
    });

    it('should set cursor position according to selectOffset when selectLength is 0', () => {
      textarea.value = '';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;

      viewer.insertTextAtCursor('hello', 3, 0);

      expect(textarea.value).toBe('hello');
      expect(textarea.selectionStart).toBe(3);
      expect(textarea.selectionEnd).toBe(3);
    });

    it('should call document.execCommand when document.queryCommandSupported("insertText") returns true', () => {
      const origQuery = document.queryCommandSupported;
      const origExec = document.execCommand;

      document.queryCommandSupported = jest.fn().mockImplementation(cmd => cmd === 'insertText');
      document.execCommand = jest.fn();

      textarea.value = 'abc';
      textarea.selectionStart = 3;
      textarea.selectionEnd = 3;

      viewer.insertTextAtCursor('def');

      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'def');
      expect(viewer.handleEditorInput).toHaveBeenCalledTimes(1);

      document.queryCommandSupported = origQuery;
      document.execCommand = origExec;
    });
  });

  describe('formatWrap', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();
    });

    it('should insert wrapped defaultText when no text is selected', () => {
      textarea.value = '';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;

      viewer.formatWrap('**', '**', 'negrito');

      expect(textarea.value).toBe('**negrito**');
      expect(textarea.selectionStart).toBe(2);
      expect(textarea.selectionEnd).toBe(9);
      expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('negrito');
    });

    it('should insert wrapped "texto" when no text is selected and defaultText argument is omitted', () => {
      textarea.value = '';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;

      viewer.formatWrap('**', '**');

      expect(textarea.value).toBe('**texto**');
      expect(textarea.selectionStart).toBe(2);
      expect(textarea.selectionEnd).toBe(7);
      expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('texto');
    });

    it('should wrap selected text with before and after markers', () => {
      textarea.value = 'Hello world';
      textarea.selectionStart = 6;
      textarea.selectionEnd = 11;

      viewer.formatWrap('*', '*', 'itálico');

      expect(textarea.value).toBe('Hello *world*');
      expect(textarea.selectionStart).toBe(7);
      expect(textarea.selectionEnd).toBe(12);
      expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('world');
    });

    it('should unwrap text if selected text is already wrapped with before and after markers', () => {
      textarea.value = 'Hello **world**';
      textarea.selectionStart = 8;
      textarea.selectionEnd = 13;

      viewer.formatWrap('**', '**', 'negrito');

      expect(textarea.value).toBe('Hello world');
      expect(textarea.selectionStart).toBe(6);
      expect(textarea.selectionEnd).toBe(11);
      expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('world');
    });
  });

  describe('formatHeading', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();
    });

    it('should add "# " to plain text line', () => {
      textarea.value = 'Header Title';
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      viewer.formatHeading();

      expect(textarea.value).toBe('# Header Title');
    });

    it('should convert "# " to "## "', () => {
      textarea.value = '# Header Title';
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      viewer.formatHeading();

      expect(textarea.value).toBe('## Header Title');
    });

    it('should convert "## " to "### "', () => {
      textarea.value = '## Header Title';
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      viewer.formatHeading();

      expect(textarea.value).toBe('### Header Title');
    });

    it('should remove "### " heading prefix', () => {
      textarea.value = '### Header Title';
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      viewer.formatHeading();

      expect(textarea.value).toBe('Header Title');
    });

    it('should clean up non-standard hash prefixes without space and make it "# "', () => {
      textarea.value = '##### Header Title';
      textarea.selectionStart = 7;
      textarea.selectionEnd = 7;

      viewer.formatHeading();

      expect(textarea.value).toBe('# Header Title');
    });

    it('should affect only the current line in multiline text', () => {
      textarea.value = 'First line\nSecond line\nThird line';
      const secondLinePos = 'First line\n'.length + 2;
      textarea.selectionStart = secondLinePos;
      textarea.selectionEnd = secondLinePos;

      viewer.formatHeading();

      expect(textarea.value).toBe('First line\n# Second line\nThird line');
    });
  });

  describe('formatPrefix', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();
    });

    it('should prepend prefix to single line', () => {
      textarea.value = 'List item';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 9;

      viewer.formatPrefix('- ');

      expect(textarea.value).toBe('- List item');
    });

    it('should prepend prefix to multiple lines and replace existing list markers', () => {
      textarea.value = 'item 1\n* item 2\n1. item 3';
      textarea.selectionStart = 0;
      textarea.selectionEnd = textarea.value.length;

      viewer.formatPrefix('- ');

      expect(textarea.value).toBe('- item 1\n- item 2\n- item 3');
    });

    it('should format auto-incrementing numbers when prefix is "1. "', () => {
      textarea.value = 'Apple\nBanana\nCherry';
      textarea.selectionStart = 0;
      textarea.selectionEnd = textarea.value.length;

      viewer.formatPrefix('1. ');

      expect(textarea.value).toBe('1. Apple\n2. Banana\n3. Cherry');
    });

    it('should remove prefix if all lines already start with the prefix', () => {
      textarea.value = '- Item A\n- Item B';
      textarea.selectionStart = 0;
      textarea.selectionEnd = textarea.value.length;

      viewer.formatPrefix('- ');

      expect(textarea.value).toBe('Item A\nItem B');
    });
  });

  describe('formatLink, formatImage, formatCodeBlock, formatTable', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();
    });

    describe('formatLink', () => {
      it('should format selected text as link', () => {
        textarea.value = 'click here';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 10;

        viewer.formatLink();

        expect(textarea.value).toBe('[click here](https://exemplo.com)');
        expect(textarea.selectionStart).toBe(13);
        expect(textarea.selectionEnd).toBe(32);
        expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('https://exemplo.com');
      });

      it('should use default text when nothing is selected', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatLink();

        expect(textarea.value).toBe('[texto do link](https://exemplo.com)');
      });
    });

    describe('formatImage', () => {
      it('should format selected text as image alt text', () => {
        textarea.value = 'My Image';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 8;

        viewer.formatImage();

        expect(textarea.value).toBe('![My Image](caminho/para/imagem.png)');
        expect(textarea.selectionStart).toBe(12);
        expect(textarea.selectionEnd).toBe(34);
        expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('caminho/para/imagem.pn');
      });

      it('should use default legend when nothing is selected', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatImage();

        expect(textarea.value).toBe('![legenda](caminho/para/imagem.png)');
      });
    });

    describe('formatCodeBlock', () => {
      it('should wrap selected code in javascript code block', () => {
        textarea.value = 'const a = 1;';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 12;

        viewer.formatCodeBlock();

        expect(textarea.value).toBe('```javascript\nconst a = 1;\n```\n');
        expect(textarea.selectionStart).toBe(3);
        expect(textarea.selectionEnd).toBe(13);
        expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('javascript');
      });

      it('should use default placeholder code when nothing is selected', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatCodeBlock();

        expect(textarea.value).toBe('```javascript\n// código aqui\n```\n');
      });
    });

    describe('formatTable', () => {
      it('should insert markdown table template', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatTable();

        expect(textarea.value).toContain('| Coluna 1 | Coluna 2 | Coluna 3 |');
        expect(textarea.value).toContain('| Item 1 | Valor A | 100 |');
      });
    });
  });

  describe('keyboard event handlers', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();
    });

    describe('handleTabKey', () => {
      it('should insert 2 spaces at cursor position when no text is selected and shift is false', () => {
        textarea.value = 'Hello';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        viewer.handleTabKey(false);

        expect(textarea.value).toBe('Hello  ');
      });

      it('should indent selected lines by 2 spaces', () => {
        textarea.value = 'line1\nline2';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 11;

        viewer.handleTabKey(false);

        expect(textarea.value).toBe('  line1\n  line2');
      });

      it('should unindent selected lines by up to 2 spaces when shift is true', () => {
        textarea.value = '  line1\n line2\nline3';
        textarea.selectionStart = 0;
        textarea.selectionEnd = textarea.value.length;

        viewer.handleTabKey(true);

        expect(textarea.value).toBe('line1\nline2\nline3');
      });
    });

    describe('handleEnterKey', () => {
      it('should continue bullet list on Enter with content', () => {
        textarea.value = '- Item 1';
        textarea.selectionStart = 8;
        textarea.selectionEnd = 8;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(textarea.value).toBe('- Item 1\n- ');
      });

      it('should remove bullet list marker on Enter with empty list item', () => {
        textarea.value = '- ';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(textarea.value).toBe('');
      });

      it('should continue task list on Enter with content', () => {
        textarea.value = '  - [x] Task 1';
        textarea.selectionStart = 14;
        textarea.selectionEnd = 14;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(textarea.value).toBe('  - [x] Task 1\n  - [ ] ');
      });

      it('should remove task list marker on Enter with empty task item', () => {
        textarea.value = '  - [ ] ';
        textarea.selectionStart = 8;
        textarea.selectionEnd = 8;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(textarea.value).toBe('');
      });

      it('should continue numbered list with incremented number on Enter with content', () => {
        textarea.value = '1. First';
        textarea.selectionStart = 8;
        textarea.selectionEnd = 8;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(textarea.value).toBe('1. First\n2. ');
      });

      it('should remove numbered list marker on Enter with empty numbered item', () => {
        textarea.value = '1. ';
        textarea.selectionStart = 3;
        textarea.selectionEnd = 3;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(textarea.value).toBe('');
      });

      it('should do nothing for normal non-list lines', () => {
        textarea.value = 'Just normal text';
        textarea.selectionStart = 16;
        textarea.selectionEnd = 16;
        const e = { preventDefault: jest.fn() };

        viewer.handleEnterKey(e);

        expect(e.preventDefault).not.toHaveBeenCalled();
        expect(textarea.value).toBe('Just normal text');
      });
    });

    describe('handleEditorKeydown', () => {
      it('should handle Ctrl+B / Cmd+B for bold formatting', () => {
        jest.spyOn(viewer, 'formatWrap');
        const e = { ctrlKey: true, metaKey: false, key: 'b', shiftKey: false, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(viewer.formatWrap).toHaveBeenCalledWith('**', '**', 'negrito');
      });

      it('should handle Ctrl+I / Cmd+I for italic formatting', () => {
        jest.spyOn(viewer, 'formatWrap');
        const e = { ctrlKey: false, metaKey: true, key: 'i', shiftKey: false, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(viewer.formatWrap).toHaveBeenCalledWith('*', '*', 'itálico');
      });

      it('should handle Ctrl+K / Cmd+K for link formatting', () => {
        jest.spyOn(viewer, 'formatLink');
        const e = { ctrlKey: true, metaKey: false, key: 'k', shiftKey: false, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(viewer.formatLink).toHaveBeenCalled();
      });

      it('should handle Ctrl+Shift+C / Cmd+Shift+C for code block formatting', () => {
        jest.spyOn(viewer, 'formatCodeBlock');
        const e = { ctrlKey: true, metaKey: false, key: 'C', shiftKey: true, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(viewer.formatCodeBlock).toHaveBeenCalled();
      });

      it('should handle Tab key', () => {
        jest.spyOn(viewer, 'handleTabKey');
        const e = { ctrlKey: false, metaKey: false, key: 'Tab', shiftKey: true, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(e.preventDefault).toHaveBeenCalled();
        expect(viewer.handleTabKey).toHaveBeenCalledWith(true);
      });

      it('should handle Enter key', () => {
        jest.spyOn(viewer, 'handleEnterKey');
        const e = { ctrlKey: false, metaKey: false, key: 'Enter', shiftKey: false, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(viewer.handleEnterKey).toHaveBeenCalledWith(e);
      });

      it('should ignore unhandled key combinations', () => {
        jest.spyOn(viewer, 'formatWrap');
        const e = { ctrlKey: true, metaKey: false, key: 'x', shiftKey: false, preventDefault: jest.fn() };

        viewer.handleEditorKeydown(e);

        expect(e.preventDefault).not.toHaveBeenCalled();
      });
    });
  });
});
