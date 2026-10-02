/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

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
      sanitize: jest.fn((html) => '<h1>Hello </h1>')
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

  it('should safely escape malicious filenames in the floating toolbar', () => {
    window.history.pushState({}, 'Test', '/%3Cimg%20src=x%20onerror=alert(1)%3E.md');
    Object.defineProperty(document, 'contentType', {
      value: 'text/markdown',
      configurable: true
    });
    document.body.innerHTML = '<pre># Test</pre>';

    window.MDViewerEngine = {
      parseMarkdown: jest.fn(() => ({
        html: '<h1>Test</h1>',
        headings: []
      }))
    };
    window.DOMPurify = {
      sanitize: jest.fn((html) => html)
    };

    eval(contentJsCode);

    const titleEl = document.querySelector('.mdviewer-doc-title');
    expect(titleEl).not.toBeNull();
    expect(titleEl.innerHTML).not.toContain('<img');
    expect(titleEl.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;.md');
  });
});
