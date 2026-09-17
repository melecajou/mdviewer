/**
 * @jest-environment jsdom
 */

const MDViewerBase = require('./MDViewerBase');

describe('MDViewerBase.initMermaid', () => {
  let viewer;

  beforeEach(() => {
    viewer = new MDViewerBase();
    document.documentElement.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    delete window.mermaid;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
