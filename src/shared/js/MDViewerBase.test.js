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
});
