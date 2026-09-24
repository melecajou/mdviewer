/**
 * @jest-environment jsdom
 */

const MDViewerBase = require('../../shared/js/MDViewerBase');
global.MDViewerBase = MDViewerBase;

const MDViewerExtensionApp = require('./viewer');

describe('MDViewerExtensionApp - Find in Page', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="markdown-container"></div>
      <span id="find-count"></span>
    `;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    app = Object.create(MDViewerExtensionApp.prototype);
    app.markdownContainer = document.getElementById('markdown-container');
    app.findCount = document.getElementById('find-count');
    app.findMatches = [];
    app.currentFindIndex = -1;
  });

  it('should find matches across text nodes and highlight them', () => {
    app.markdownContainer.innerHTML = '<p>Hello world! Hello JavaScript. Search test.</p>';
    app.performFind('hello');

    expect(app.findMatches.length).toBe(2);
    expect(app.currentFindIndex).toBe(0);
    expect(app.findCount.textContent).toBe('1 / 2');

    const marks = app.markdownContainer.querySelectorAll('.find-match');
    expect(marks.length).toBe(2);
    expect(marks[0].classList.contains('current')).toBe(true);
    expect(marks[1].classList.contains('current')).toBe(false);
  });

  it('should navigate matches using findNext and findPrevious', () => {
    app.markdownContainer.innerHTML = '<p>One test, two test, three test.</p>';
    app.performFind('test');

    expect(app.findMatches.length).toBe(3);
    expect(app.currentFindIndex).toBe(0);

    app.findNext();
    expect(app.currentFindIndex).toBe(1);
    expect(app.findCount.textContent).toBe('2 / 3');

    app.findNext();
    expect(app.currentFindIndex).toBe(2);
    expect(app.findCount.textContent).toBe('3 / 3');

    app.findNext();
    expect(app.currentFindIndex).toBe(0);
    expect(app.findCount.textContent).toBe('1 / 3');

    app.findPrevious();
    expect(app.currentFindIndex).toBe(2);
    expect(app.findCount.textContent).toBe('3 / 3');
  });

  it('should clear find highlights correctly', () => {
    app.markdownContainer.innerHTML = '<p>Clear test one and clear test two.</p>';
    app.performFind('test');

    expect(app.findMatches.length).toBe(2);

    app.clearFindHighlights();
    expect(app.findMatches.length).toBe(0);
    expect(app.currentFindIndex).toBe(-1);
    expect(app.markdownContainer.querySelectorAll('.find-match').length).toBe(0);
    expect(app.markdownContainer.textContent).toBe('Clear test one and clear test two.');
  });

  it('should handle queries shorter than 2 characters gracefully', () => {
    app.markdownContainer.innerHTML = '<p>Short query test</p>';
    app.performFind('a');

    expect(app.findMatches.length).toBe(0);
    expect(app.findCount.textContent).toBe('0 / 0');
  });

  it('should handle query with special regex characters safely', () => {
    app.markdownContainer.innerHTML = '<p>Special [test] and (test) and *test*.</p>';
    app.performFind('[test]');

    expect(app.findMatches.length).toBe(1);
    expect(app.findMatches[0].textContent).toBe('[test]');
  });

  it('should preserve text with HTML special characters safely', () => {
    app.markdownContainer.innerHTML = '<p>Text with &lt;script&gt; tag and &amp; symbol.</p>';
    app.performFind('script');

    expect(app.findMatches.length).toBe(1);
    expect(app.markdownContainer.textContent).toBe('Text with <script> tag and & symbol.');
  });
});
