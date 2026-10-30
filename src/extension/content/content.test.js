/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const MDViewerBase = require('../../shared/js/MDViewerBase');

describe('Content script (content.js) - Security & Sanitization', () => {
  let contentJsCode;

  beforeAll(() => {
    const contentJsPath = path.join(__dirname, 'content.js');
    contentJsCode = fs.readFileSync(contentJsPath, 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.innerHTML = '';
    delete window.__MDVIEWER_INITIALIZED__;
    delete window.MDViewerEngine;
    delete window.DOMPurify;
    delete window.chrome;

    window.MDViewerBase = MDViewerBase;

    // Mock chrome API
    window.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({ theme: 'github-dark' })),
          set: jest.fn()
        },
        onChanged: {
          addListener: jest.fn()
        }
      },
      runtime: {
        sendMessage: jest.fn()
      }
    };
  });

  function setupDOMWithMarkdownPre(content = '# Hello World') {
    window.history.pushState({}, 'Test', '/test-file.md');
    Object.defineProperty(document, 'contentType', {
      value: 'text/markdown',
      configurable: true
    });

    document.body.innerHTML = `<pre>${content}</pre>`;
  }

  it('should render sanitized HTML when DOMPurify is available', () => {
    setupDOMWithMarkdownPre('# Hello <script>alert(1)</script>');

    window.MDViewerEngine = {
      parseMarkdown: jest.fn(() => ({
        html: '<h1>Hello <script>alert(1)</script></h1>',
        headings: []
      }))
    };

    window.DOMPurify = {
      sanitize: jest.fn(() => '<h1>Hello </h1>')
    };

    eval(contentJsCode);

    const renderedContent = document.getElementById('mdviewer-rendered-content');
    expect(renderedContent).not.toBeNull();
    expect(window.DOMPurify.sanitize).toHaveBeenCalledWith('<h1>Hello <script>alert(1)</script></h1>', {
      USE_PROFILES: { html: true }
    });
    expect(renderedContent.innerHTML).toBe('<h1>Hello </h1>');
  });

  it('should display error message and NOT render unsanitized HTML if DOMPurify is missing', () => {
    setupDOMWithMarkdownPre('# Unsafe <img src=x onerror=alert(1)>');

    window.MDViewerEngine = {
      parseMarkdown: jest.fn(() => ({
        html: '<h1>Unsafe <img src=x onerror=alert(1)></h1>',
        headings: []
      }))
    };

    delete window.DOMPurify;

    eval(contentJsCode);

    const renderedContent = document.getElementById('mdviewer-rendered-content');
    expect(renderedContent).not.toBeNull();
    expect(renderedContent.innerHTML).toContain('DOMPurify');
    expect(renderedContent.innerHTML).toContain('cancelada por segurança');
    expect(renderedContent.innerHTML).not.toContain('<img src=x onerror=alert(1)>');
  });

  it('should escape malicious HTML and XSS payloads in filename in toolbar', () => {
    const maliciousFilename = '<img src=x onerror=alert(1)>.md';
    window.history.pushState({}, 'Test', '/' + encodeURIComponent(maliciousFilename));
    Object.defineProperty(document, 'contentType', {
      value: 'text/markdown',
      configurable: true
    });
    document.body.innerHTML = '<pre># Test Document</pre>';

    window.MDViewerEngine = {
      parseMarkdown: jest.fn(() => ({
        html: '<h1>Test Document</h1>',
        headings: []
      }))
    };
    window.DOMPurify = {
      sanitize: jest.fn((html) => html)
    };

    eval(contentJsCode);

    const titleEl = document.querySelector('.mdviewer-doc-title');
    expect(titleEl).not.toBeNull();
    expect(titleEl.querySelector('img')).toBeNull();
    expect(titleEl.innerHTML).not.toContain('<img');
    expect(titleEl.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;.md');
    expect(titleEl.textContent).toBe(maliciousFilename);
    expect(titleEl.getAttribute('title')).toBe(maliciousFilename);
  });

  it('should handle source mode toggle and TOC toggle interactions correctly', () => {
    setupDOMWithMarkdownPre('# Heading 1\nContent');

    window.MDViewerEngine = {
      parseMarkdown: jest.fn(() => ({
        html: '<h1>Heading 1</h1><p>Content</p>',
        headings: [{ id: 'heading-1', text: 'Heading 1', level: 1 }]
      }))
    };
    window.DOMPurify = {
      sanitize: jest.fn((html) => html)
    };

    eval(contentJsCode);

    const btnMode = document.getElementById('mdviewer-btn-mode');
    const btnModeText = document.getElementById('mdviewer-btn-mode-text');
    const renderedContent = document.getElementById('mdviewer-rendered-content');
    const rawView = document.getElementById('mdviewer-raw-view');
    const btnToc = document.getElementById('mdviewer-btn-toc');
    const tocSidebar = document.getElementById('mdviewer-toc-sidebar');
    const tocNav = document.getElementById('mdviewer-toc-nav');

    expect(tocNav.innerHTML).toContain('Heading 1');

    // Toggle source mode
    btnMode.click();
    expect(renderedContent.style.display).toBe('none');
    expect(rawView.style.display).toBe('block');
    expect(btnModeText.textContent).toBe('Visualizar');

    btnMode.click();
    expect(renderedContent.style.display).toBe('block');
    expect(rawView.style.display).toBe('none');
    expect(btnModeText.textContent).toBe('Fonte');

    // Toggle TOC
    expect(tocSidebar.classList.contains('visible')).toBe(false);
    btnToc.click();
    expect(tocSidebar.classList.contains('visible')).toBe(true);
  });
});
