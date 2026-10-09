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

  describe('copyToClipboard', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined)
        },
        configurable: true
      });
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should write text to navigator.clipboard and update button span text', async () => {
      const btn = document.createElement('button');
      const span = document.createElement('span');
      span.className = 'copy-text';
      span.textContent = 'Copy';
      btn.appendChild(span);

      const promise = viewer.copyToClipboard('const x = 1;', { button: btn, copiedText: 'Copiado!', timeout: 1800 });
      await promise;

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
      expect(span.textContent).toBe('Copiado!');

      jest.advanceTimersByTime(1800);
      expect(span.textContent).toBe('Copy');
    });

    it('should support copiedClass and explicit originalText', async () => {
      const btn = document.createElement('button');
      const span = document.createElement('span');
      span.className = 'copy-text';
      span.textContent = 'Original';
      btn.appendChild(span);

      const promise = viewer.copyToClipboard('hello', {
        button: btn,
        copiedText: 'Done!',
        originalText: 'Copiar',
        copiedClass: 'copied',
        timeout: 1000
      });
      await promise;

      expect(btn.classList.contains('copied')).toBe(true);
      expect(span.textContent).toBe('Done!');

      jest.advanceTimersByTime(1000);
      expect(btn.classList.contains('copied')).toBe(false);
      expect(span.textContent).toBe('Copiar');
    });

    it('should handle button without span when copiedClass is provided', async () => {
      const btn = document.createElement('button');

      const promise = viewer.copyToClipboard('test', { button: btn, copiedClass: 'copied', timeout: 500 });
      await promise;

      expect(btn.classList.contains('copied')).toBe(true);

      jest.advanceTimersByTime(500);
      expect(btn.classList.contains('copied')).toBe(false);
    });

    it('should work without button passed', async () => {
      await viewer.copyToClipboard('simple text');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('simple text');
    });
  });

  describe('Formatting and Editor Methods', () => {
    let textarea;

    beforeEach(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      viewer.sourceTextarea = textarea;
      viewer.handleEditorInput = jest.fn();

      if (!document.queryCommandSupported) {
        document.queryCommandSupported = jest.fn();
      }
      if (!document.execCommand) {
        document.execCommand = jest.fn();
      }
    });

    afterEach(() => {
      textarea.remove();
    });

    describe('insertTextAtCursor', () => {
      it('should insert text using document.execCommand if queryCommandSupported returns true', () => {
        const querySpy = jest.spyOn(document, 'queryCommandSupported').mockReturnValue(true);
        const execSpy = jest.spyOn(document, 'execCommand').mockReturnValue(true);

        textarea.value = 'Hello world';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        viewer.insertTextAtCursor(' beautiful');

        expect(querySpy).toHaveBeenCalledWith('insertText');
        expect(execSpy).toHaveBeenCalledWith('insertText', false, ' beautiful');
        expect(viewer.handleEditorInput).toHaveBeenCalled();

        querySpy.mockRestore();
        execSpy.mockRestore();
      });

      it('should insert text using string manipulation fallback when queryCommandSupported is false', () => {
        const querySpy = jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);

        textarea.value = 'Hello world';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        viewer.insertTextAtCursor(' beautiful');

        expect(textarea.value).toBe('Hello beautiful world');
        expect(textarea.selectionStart).toBe(15);
        expect(textarea.selectionEnd).toBe(15);
        expect(viewer.handleEditorInput).toHaveBeenCalled();

        querySpy.mockRestore();
      });

      it('should adjust selection range when selectOffset and selectLength are provided', () => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);

        textarea.value = 'Hello';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        // Insert " world" and set selection inside the inserted string
        viewer.insertTextAtCursor(' world', 1, 5);

        expect(textarea.value).toBe('Hello world');
        expect(textarea.selectionStart).toBe(6); // 5 + 1
        expect(textarea.selectionEnd).toBe(11);  // 5 + 1 + 5
      });

      it('should adjust single cursor position when selectOffset > 0 and selectLength is 0', () => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);

        textarea.value = 'Hello';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        viewer.insertTextAtCursor(' world', 3, 0);

        expect(textarea.selectionStart).toBe(8); // 5 + 3
        expect(textarea.selectionEnd).toBe(8);
      });
    });

    describe('formatWrap', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should wrap selected text with before and after strings', () => {
        textarea.value = 'Hello world';
        textarea.selectionStart = 6;
        textarea.selectionEnd = 11;

        viewer.formatWrap('**', '**', 'negrito');

        expect(textarea.value).toBe('Hello **world**');
        expect(textarea.selectionStart).toBe(8);
        expect(textarea.selectionEnd).toBe(13);
      });

      it('should unwrap text if it is already wrapped with before and after strings', () => {
        textarea.value = 'Hello **world**';
        textarea.selectionStart = 8;
        textarea.selectionEnd = 13;

        viewer.formatWrap('**', '**', 'negrito');

        expect(textarea.value).toBe('Hello world');
        expect(textarea.selectionStart).toBe(6);
        expect(textarea.selectionEnd).toBe(11);
      });

      it('should insert defaultText wrapped when no text is selected', () => {
        textarea.value = 'Hello ';
        textarea.selectionStart = 6;
        textarea.selectionEnd = 6;

        viewer.formatWrap('*', '*', 'itálico');

        expect(textarea.value).toBe('Hello *itálico*');
        expect(textarea.selectionStart).toBe(7);
        expect(textarea.selectionEnd).toBe(14);
      });
    });

    describe('formatHeading', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should convert unheaded line to H1 (# )', () => {
        textarea.value = 'Title';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;

        viewer.formatHeading();

        expect(textarea.value).toBe('# Title');
      });

      it('should cycle H1 (# ) to H2 (## )', () => {
        textarea.value = '# Title';
        textarea.selectionStart = 3;
        textarea.selectionEnd = 3;

        viewer.formatHeading();

        expect(textarea.value).toBe('## Title');
      });

      it('should cycle H2 (## ) to H3 (### )', () => {
        textarea.value = '## Title';
        textarea.selectionStart = 4;
        textarea.selectionEnd = 4;

        viewer.formatHeading();

        expect(textarea.value).toBe('### Title');
      });

      it('should cycle H3 (### ) back to normal text', () => {
        textarea.value = '### Title';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        viewer.formatHeading();

        expect(textarea.value).toBe('Title');
      });
    });

    describe('formatPrefix', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should add prefix to selected single line', () => {
        textarea.value = 'Item 1';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 6;

        viewer.formatPrefix('- ');

        expect(textarea.value).toBe('- Item 1');
      });

      it('should add prefix to multiline selection', () => {
        textarea.value = 'Line 1\nLine 2';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 13;

        viewer.formatPrefix('> ');

        expect(textarea.value).toBe('> Line 1\n> Line 2');
      });

      it('should remove prefix if all lines already have the prefix', () => {
        textarea.value = '> Line 1\n> Line 2';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 17;

        viewer.formatPrefix('> ');

        expect(textarea.value).toBe('Line 1\nLine 2');
      });

      it('should format ordered list prefix "1. " with sequential numbers', () => {
        textarea.value = 'First\nSecond\nThird';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 18;

        viewer.formatPrefix('1. ');

        expect(textarea.value).toBe('1. First\n2. Second\n3. Third');
      });

      it('should strip existing prefixes when adding a new prefix type', () => {
        textarea.value = '- Bullet item';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 13;

        viewer.formatPrefix('1. ');

        expect(textarea.value).toBe('1. Bullet item');
      });
    });

    describe('formatLink', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should insert default link text when nothing is selected', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatLink();

        expect(textarea.value).toBe('[texto do link](https://exemplo.com)');
        expect(textarea.selectionStart).toBe(16);
        expect(textarea.selectionEnd).toBe(35);
      });

      it('should insert link with selected text', () => {
        textarea.value = 'Google';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 6;

        viewer.formatLink();

        expect(textarea.value).toBe('[Google](https://exemplo.com)');
        expect(textarea.selectionStart).toBe(9);
        expect(textarea.selectionEnd).toBe(28);
      });
    });

    describe('formatImage', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should insert default image caption when nothing is selected', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatImage();

        expect(textarea.value).toBe('![legenda](caminho/para/imagem.png)');
        expect(textarea.selectionStart).toBe(11);
        expect(textarea.selectionEnd).toBe(33);
      });

      it('should insert image with selected caption text', () => {
        textarea.value = 'Logo';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 4;

        viewer.formatImage();

        expect(textarea.value).toBe('![Logo](caminho/para/imagem.png)');
        expect(textarea.selectionStart).toBe(8);
        expect(textarea.selectionEnd).toBe(30);
      });
    });

    describe('formatCodeBlock', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should insert default code block when nothing is selected', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatCodeBlock();

        expect(textarea.value).toBe('```javascript\n// código aqui\n```\n');
        expect(textarea.selectionStart).toBe(3);
        expect(textarea.selectionEnd).toBe(13);
      });

      it('should wrap selected code inside code block', () => {
        textarea.value = 'const x = 10;';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 13;

        viewer.formatCodeBlock();

        expect(textarea.value).toBe('```javascript\nconst x = 10;\n```\n');
      });
    });

    describe('formatTable', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      it('should insert markdown table template', () => {
        textarea.value = '';
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        viewer.formatTable();

        const expected = '| Coluna 1 | Coluna 2 | Coluna 3 |\n| :--- | :--- | :--- |\n| Item 1 | Valor A | 100 |\n| Item 2 | Valor B | 200 |\n';
        expect(textarea.value).toBe(expected);
      });
    });

    describe('Keyboard Event Handlers', () => {
      beforeEach(() => {
        jest.spyOn(document, 'queryCommandSupported').mockReturnValue(false);
      });

      describe('handleEditorKeydown', () => {
        it('should trigger formatWrap for bold on Ctrl+B', () => {
          const spy = jest.spyOn(viewer, 'formatWrap');
          const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true });
          const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

          viewer.handleEditorKeydown(event);

          expect(preventDefaultSpy).toHaveBeenCalled();
          expect(spy).toHaveBeenCalledWith('**', '**', 'negrito');
        });

        it('should trigger formatWrap for italic on Cmd+I', () => {
          const spy = jest.spyOn(viewer, 'formatWrap');
          const event = new KeyboardEvent('keydown', { key: 'i', metaKey: true });

          viewer.handleEditorKeydown(event);

          expect(spy).toHaveBeenCalledWith('*', '*', 'itálico');
        });

        it('should trigger formatLink on Ctrl+K', () => {
          const spy = jest.spyOn(viewer, 'formatLink');
          const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });

          viewer.handleEditorKeydown(event);

          expect(spy).toHaveBeenCalled();
        });

        it('should trigger formatCodeBlock on Ctrl+Shift+C', () => {
          const spy = jest.spyOn(viewer, 'formatCodeBlock');
          const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, shiftKey: true });

          viewer.handleEditorKeydown(event);

          expect(spy).toHaveBeenCalled();
        });

        it('should trigger handleTabKey on Tab key', () => {
          const spy = jest.spyOn(viewer, 'handleTabKey');
          const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });

          viewer.handleEditorKeydown(event);

          expect(spy).toHaveBeenCalledWith(true);
        });

        it('should trigger handleEnterKey on Enter key', () => {
          const spy = jest.spyOn(viewer, 'handleEnterKey');
          const event = new KeyboardEvent('keydown', { key: 'Enter' });

          viewer.handleEditorKeydown(event);

          expect(spy).toHaveBeenCalledWith(event);
        });
      });

      describe('handleTabKey', () => {
        it('should insert two spaces when single cursor and not shift', () => {
          textarea.value = 'hello';
          textarea.selectionStart = 5;
          textarea.selectionEnd = 5;

          viewer.handleTabKey(false);

          expect(textarea.value).toBe('hello  ');
        });

        it('should indent selected lines on Tab', () => {
          textarea.value = 'line1\nline2';
          textarea.selectionStart = 0;
          textarea.selectionEnd = 11;

          viewer.handleTabKey(false);

          expect(textarea.value).toBe('  line1\n  line2');
        });

        it('should unindent selected lines on Shift+Tab', () => {
          textarea.value = '  line1\n  line2';
          textarea.selectionStart = 0;
          textarea.selectionEnd = 15;

          viewer.handleTabKey(true);

          expect(textarea.value).toBe('line1\nline2');
        });

        it('should unindent single space if line starts with 1 space on Shift+Tab', () => {
          textarea.value = ' line1';
          textarea.selectionStart = 0;
          textarea.selectionEnd = 6;

          viewer.handleTabKey(true);

          expect(textarea.value).toBe('line1');
        });
      });

      describe('handleEnterKey', () => {
        it('should auto-continue bullet list', () => {
          textarea.value = '- Item 1';
          textarea.selectionStart = 8;
          textarea.selectionEnd = 8;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });
          const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

          viewer.handleEnterKey(event);

          expect(preventDefaultSpy).toHaveBeenCalled();
          expect(textarea.value).toBe('- Item 1\n- ');
        });

        it('should exit bullet list when enter is pressed on empty bullet item', () => {
          textarea.value = '- ';
          textarea.selectionStart = 2;
          textarea.selectionEnd = 2;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });

          viewer.handleEnterKey(event);

          expect(textarea.value).toBe('');
        });

        it('should auto-continue task list', () => {
          textarea.value = '- [x] Task 1';
          textarea.selectionStart = 12;
          textarea.selectionEnd = 12;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });

          viewer.handleEnterKey(event);

          expect(textarea.value).toBe('- [x] Task 1\n- [ ] ');
        });

        it('should exit task list when enter is pressed on empty task item', () => {
          textarea.value = '- [ ] ';
          textarea.selectionStart = 6;
          textarea.selectionEnd = 6;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });

          viewer.handleEnterKey(event);

          expect(textarea.value).toBe('');
        });

        it('should auto-continue numbered list with incremented index', () => {
          textarea.value = '1. First';
          textarea.selectionStart = 8;
          textarea.selectionEnd = 8;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });

          viewer.handleEnterKey(event);

          expect(textarea.value).toBe('1. First\n2. ');
        });

        it('should exit numbered list when enter is pressed on empty numbered item', () => {
          textarea.value = '2. ';
          textarea.selectionStart = 3;
          textarea.selectionEnd = 3;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });

          viewer.handleEnterKey(event);

          expect(textarea.value).toBe('');
        });

        it('should do nothing special for normal text lines on enter', () => {
          textarea.value = 'Normal text';
          textarea.selectionStart = 11;
          textarea.selectionEnd = 11;

          const event = new KeyboardEvent('keydown', { key: 'Enter' });
          const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

          viewer.handleEnterKey(event);

          expect(preventDefaultSpy).not.toHaveBeenCalled();
          expect(textarea.value).toBe('Normal text');
        });
      });
    });
  });
});
