/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Read the class definition from the file and eval it so we can test it
const mdViewerBaseSource = fs.readFileSync(path.join(__dirname, 'MDViewerBase.js'), 'utf8');

// Run it in the test context
const MDViewerBase = eval(`${mdViewerBaseSource}\nMDViewerBase;`);

describe('MDViewerBase', () => {
  let viewer;

  beforeEach(() => {
    // Setup fake DOM and environment
    document.body.innerHTML = '';

    // Create an instance
    viewer = new MDViewerBase();
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
      // Mock DOM structure
      const btn = document.createElement('button');
      const span = document.createElement('span');
      span.textContent = 'Save';
      btn.appendChild(span);
      viewer.btnSaveFile = btn;

      viewer.showSaveFeedback();

      // Check initial state
      expect(span.textContent).toBe('Salvo!');
      expect(btn.style.color).toBe('rgb(63, 185, 80)'); // Hex #3fb950 converts to this in JSDOM

      // Advance time by 1499ms (not enough to trigger restore)
      jest.advanceTimersByTime(1499);
      expect(span.textContent).toBe('Salvo!');
      expect(btn.style.color).toBe('rgb(63, 185, 80)');

      // Advance time by 1ms (to 1500ms, should trigger restore)
      jest.advanceTimersByTime(1);
      expect(span.textContent).toBe('Save');
      expect(btn.style.color).toBe('');
    });

    it('should set text content to the provided argument, update color, and restore after 1500ms', () => {
      // Mock DOM structure
      const btn = document.createElement('button');
      const span = document.createElement('span');
      span.textContent = 'Guardar';
      btn.appendChild(span);
      viewer.btnSaveFile = btn;

      viewer.showSaveFeedback('Saved custom!');

      // Check initial state
      expect(span.textContent).toBe('Saved custom!');
      expect(btn.style.color).toBe('rgb(63, 185, 80)');

      // Advance time by 1500ms
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
      // No span appended
      viewer.btnSaveFile = btn;

      expect(() => {
        viewer.showSaveFeedback();
      }).not.toThrow();
    });
  });
});
