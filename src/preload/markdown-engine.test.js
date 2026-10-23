const hljs = require('highlight.js');
const katex = require('katex');
const {
  slugify,
  parseMarkdown,
  splitHighlightedLines,
  processMath,
  renderCache,
  renderHeading,
  renderCode,
  renderBlockquote,
  renderTable,
  renderListitem,
  renderLink,
  renderImage,
  createCustomRenderer
} = require('./markdown-engine');

describe('slugify', () => {
  test('should lowercase text', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  test('should trim whitespace at the beginning and end', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  test('should remove HTML tags', () => {
    expect(slugify('<h1>Hello World</h1>')).toBe('hello-world');
    expect(slugify('<p>This is a <strong>test</strong></p>')).toBe('this-is-a-test');
  });

  test('should keep alphanumeric characters and accents', () => {
    expect(slugify('café')).toBe('café');
    expect(slugify('não')).toBe('não');
    expect(slugify('über')).toBe('über');
    expect(slugify('çatal')).toBe('çatal');
    expect(slugify('123abc456')).toBe('123abc456');
  });

  test('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  test('should collapse multiple spaces and hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
    expect(slugify('hello---world')).toBe('hello-world');
    expect(slugify('hello - world')).toBe('hello-world');
  });

  test('should remove special characters and punctuation', () => {
    expect(slugify('hello @#$%^&*() world')).toBe('hello-world');
    expect(slugify('hello, world!')).toBe('hello-world');
    expect(slugify('what?')).toBe('what');
  });
});

describe('parseMarkdown', () => {
  beforeEach(() => {
    if (renderCache) {
      renderCache.clear();
    }
  });

  test('should parse basic paragraph', () => {
    const result = parseMarkdown('Hello world');
    expect(result.html.trim()).toBe('<p>Hello world</p>');
    expect(result.headings).toEqual([]);
  });

  test('should parse and extract headings', () => {
    const result = parseMarkdown('# Heading 1\n## Heading 2\n### Heading 3');

    expect(result.headings).toEqual([
      { level: 1, text: 'Heading 1', id: 'heading-1' },
      { level: 2, text: 'Heading 2', id: 'heading-2' },
      { level: 3, text: 'Heading 3', id: 'heading-3' }
    ]);

    expect(result.html).toContain('id="heading-1"');
    expect(result.html).toContain('id="heading-2"');
    expect(result.html).toContain('id="heading-3"');
    expect(result.html).toContain('class="md-heading md-h1"');
  });

  test('should handle duplicate headings by appending an index', () => {
    const result = parseMarkdown('# Test\n# Test');
    expect(result.headings[0].id).toBe('test');
    expect(result.headings[1].id).toBe('test-1');
  });

  test('should render basic code block', () => {
    const result = parseMarkdown('```js\nconst x = 1;\n```');
    expect(result.html).toContain('class="code-block-wrapper"');
    expect(result.html).toContain('code-lang-badge');
    expect(result.html).toContain('js');
    expect(result.html).toContain('<span class="hljs-keyword">const</span> x = <span class="hljs-number">1</span>;');
  });

  test('should fallback to highlightAuto when hljs.highlight throws an error', () => {
    const highlightSpy = jest.spyOn(hljs, 'highlight').mockImplementation(() => {
      throw new Error('Highlight failed');
    });
    const highlightAutoSpy = jest.spyOn(hljs, 'highlightAuto');

    const result = parseMarkdown('```js\nconst x = 1;\n```');

    expect(highlightSpy).toHaveBeenCalled();
    expect(highlightAutoSpy).toHaveBeenCalledWith('const x = 1;');
    expect(result.html).toContain('class="code-block-wrapper"');
    expect(result.html).toContain('code-lang-badge');

    highlightSpy.mockRestore();
    highlightAutoSpy.mockRestore();
  });

  test('should fallback to escaping HTML when hljs.highlightAuto fails', () => {
    const spy = jest.spyOn(hljs, 'highlightAuto').mockImplementation(() => {
      throw new Error('Highlighting failed');
    });

    const markdown = '```\nif (a && b < c > d) {}\n```';
    const result = parseMarkdown(markdown);

    expect(result.html).toContain('if (a &amp;&amp; b &lt; c &gt; d) {}');
    spy.mockRestore();
  });

  test('should render mermaid code block', () => {
    const result = parseMarkdown('```mermaid\ngraph TD;\nA-->B;\n```');
    expect(result.html).toContain('class="mermaid-block-wrapper"');
    expect(result.html).toContain('class="mermaid"');
    expect(result.html).toContain('graph TD;\nA-->B;');
  });

  test('should render blockquote as alert', () => {
    const result = parseMarkdown('> [!NOTE]\n> This is a note');
    expect(result.html).toContain('class="markdown-alert markdown-alert-note"');
    expect(result.html).toContain('This is a note');
  });

  test('should render standard blockquote', () => {
    const result = parseMarkdown('> Just a quote');
    expect(result.html).toContain('<blockquote>');
    expect(result.html).toContain('Just a quote');
    expect(result.html).toContain('</blockquote>');
  });

  test('should render standard list', () => {
    const result = parseMarkdown('- Item 1\n- Item 2');
    expect(result.html).toContain('<li>Item 1</li>');
    expect(result.html).toContain('<li>Item 2</li>');
  });

  test('should render task list', () => {
    const result = parseMarkdown('- [ ] Task 1\n- [x] Task 2');
    expect(result.html).toContain('class="task-list-item task-unchecked"');
    expect(result.html).toContain('class="task-list-item task-checked"');
    expect(result.html).toContain('Task 1');
    expect(result.html).toContain('Task 2');
  });

  test('should render internal and external links', () => {
    const result = parseMarkdown('[Internal](local.md) and [External](https://example.com) and [Anchor](#heading-1)');
    expect(result.html).toContain('class="internal-link" data-local-path="local.md"');
    expect(result.html).toContain('class="external-link" target="_blank"');
    expect(result.html).toContain('class="anchor-link"');
  });

  test('should render images', () => {
    const result = parseMarkdown('![Alt text](image.png "Title")');
    expect(result.html).toContain('<figure class="md-image-figure">');
    expect(result.html).toContain('<img src="image.png" alt="Alt text" title="Title"');
    expect(result.html).toContain('<figcaption class="md-image-caption">Alt text</figcaption>');
  });

  test('should render tables with wrapper', () => {
    const result = parseMarkdown('| A | B |\n|---|---|\n| 1 | 2 |');
    expect(result.html).toContain('<div class="table-responsive">');
    expect(result.html).toContain('<table>');
    expect(result.html).toContain('<th>A</th>');
  });

  test('should render inline and block math via katex', () => {
    const result = parseMarkdown('Inline math $E=mc^2$ and block math\n\n$$a^2 + b^2 = c^2$$');
    expect(result.html).toContain('class="katex-inline"');
    expect(result.html).toContain('class="katex-block"');
  });

  test('should not interpret currency as inline math', () => {
    const result = parseMarkdown('This costs \\$50 or \\$100.00');
    expect(result.html).not.toContain('class="katex-inline"');
    expect(result.html).toContain('$50');
    expect(result.html).toContain('$100.00');
  });

  test('should calculate statistics correctly', () => {
    const markdown = '# Title\n\nThis is a simple paragraph with some words.\n\n```js\nconst x = 1;\n```';
    const result = parseMarkdown(markdown);
    expect(result.stats).toBeDefined();
    // Words should exclude markdown symbols and code blocks.
    // "Title", "This", "is", "a", "simple", "paragraph", "with", "some", "words." -> 9 words.
    expect(result.stats.words).toBe(9);
    expect(result.stats.chars).toBe(markdown.length);
    expect(result.stats.lines).toBe(markdown.split('\n').length);
    expect(result.stats.readTimeMinutes).toBe(1);
  });

  describe('caching and input edge cases', () => {
    test('should return default empty structure when rawContent is falsy or not a string', () => {
      const defaultStats = { words: 0, chars: 0, lines: 0, readTimeMinutes: 0 };
      const expected = { html: '', headings: [], stats: defaultStats };

      expect(parseMarkdown(null)).toEqual(expected);
      expect(parseMarkdown(undefined)).toEqual(expected);
      expect(parseMarkdown(12345)).toEqual(expected);
      expect(parseMarkdown({})).toEqual(expected);
      expect(parseMarkdown(true)).toEqual(expected);
      expect(parseMarkdown(['content'])).toEqual(expected);
    });

    test('should cache and return cached parse result on identical input', () => {
      const largeMarkdown = `# Documentation Title\n\n` +
        `This is a long markdown document used to test render caching.\n\n` +
        `## Section 1: Code\n\n` +
        `\`\`\`js\nfunction calculateSum(a, b) {\n  return a + b;\n}\n\`\`\`\n\n` +
        `## Section 2: Math\n\n` +
        `Formula: $E = mc^2$\n\n` +
        `$$ \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2} $$\n\n` +
        `> [!NOTE]\n> Ensure caching works for identical inputs.\n`;

      expect(renderCache.size).toBe(0);

      // First call (cache miss)
      const firstResult = parseMarkdown(largeMarkdown);
      expect(renderCache.size).toBe(1);

      // Second call with same input (cache hit)
      const secondResult = parseMarkdown(largeMarkdown);
      expect(renderCache.size).toBe(1);
      expect(secondResult).toBe(firstResult); // Should return identical cached object reference
    });

    test('should re-parse and add new entry to cache when content changes', () => {
      const docA = '# Document A\n\nContent for document A.';
      const docB = '# Document B\n\nContent for document B.';

      expect(renderCache.size).toBe(0);

      const resultA = parseMarkdown(docA);
      expect(renderCache.size).toBe(1);

      const resultB = parseMarkdown(docB);
      expect(renderCache.size).toBe(2);
      expect(resultB).not.toBe(resultA);
      expect(resultB.html).toContain('Document B');
    });
  });
});

describe('processMath', () => {
  test('should process block math ($$...$$) and restore rendered KaTeX HTML', () => {
    const markdown = 'Here is a formula:\n\n$$\\frac{a}{b}$$\n\nEnd.';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toContain('%%MATH_BLOCK_0%%');
    expect(processed).not.toContain('$$\\frac{a}{b}$$');

    const htmlWithPlaceholder = `<p>Here is a formula:</p><p>%%MATH_BLOCK_0%%</p><p>End.</p>`;
    const restoredHtml = restoreMath(htmlWithPlaceholder);

    expect(restoredHtml).toContain('<div class="katex-block">');
    expect(restoredHtml).toContain('katex');
    expect(restoredHtml).not.toContain('%%MATH_BLOCK_0%%');
  });

  test('should process inline math ($...$) and restore rendered KaTeX HTML', () => {
    const markdown = 'Inline math $E=mc^2$ here.';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toContain('%%MATH_INLINE_0%%');
    expect(processed).not.toContain('$E=mc^2$');

    const htmlWithPlaceholder = `<p>Inline math %%MATH_INLINE_0%% here.</p>`;
    const restoredHtml = restoreMath(htmlWithPlaceholder);

    expect(restoredHtml).toContain('<span class="katex-inline">');
    expect(restoredHtml).toContain('katex');
    expect(restoredHtml).not.toContain('%%MATH_INLINE_0%%');
  });

  test('should protect fenced code blocks from math processing', () => {
    const markdown = '```js\nconst price = "$100";\nconst formula = "$a + b$";\n```\n\nInline $x + y = z$';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toContain('```js\nconst price = "$100";\nconst formula = "$a + b$";\n```');
    expect(processed).toContain('%%MATH_INLINE_0%%');

    const restoredHtml = restoreMath(processed);
    expect(restoredHtml).toContain('const formula = "$a + b$";');
  });

  test('should protect inline code from math processing', () => {
    const markdown = 'Use `$x + y$` in inline code and $a^2$ in math.';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toContain('`$x + y$`');
    expect(processed).toContain('%%MATH_INLINE_0%%');

    const restoredHtml = restoreMath(processed);
    expect(restoredHtml).toContain('`$x + y$`');
  });

  test('should ignore pure numbers wrapped in $ as inline math', () => {
    const markdown = 'Item costs $50$ or $100.00$.';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toBe(markdown);
    expect(processed).not.toContain('%%MATH_INLINE');

    const restored = restoreMath(processed);
    expect(restored).toBe(markdown);
  });

  test('should ignore escaped dollar signs as inline math', () => {
    const markdown = 'This costs \\$50 or \\$100.00.';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toBe(markdown);
    expect(processed).not.toContain('%%MATH_INLINE');

    const restored = restoreMath(processed);
    expect(restored).toBe(markdown);
  });

  test('should handle multiple block and inline math expressions', () => {
    const markdown = 'First $a$, second $b$, and block:\n\n$$c$$\n\nand block:\n\n$$d$$';
    const { markdown: processed, restoreMath } = processMath(markdown);

    expect(processed).toContain('%%MATH_INLINE_0%%');
    expect(processed).toContain('%%MATH_INLINE_1%%');
    expect(processed).toContain('%%MATH_BLOCK_0%%');
    expect(processed).toContain('%%MATH_BLOCK_1%%');

    const restoredHtml = restoreMath(processed);
    expect(restoredHtml).not.toContain('%%MATH_');
    expect(restoredHtml).toContain('<span class="katex-inline">');
    expect(restoredHtml).toContain('<div class="katex-block">');
  });

  test('should handle katex rendering errors gracefully for block math', () => {
    const katexSpy = jest.spyOn(katex, 'renderToString').mockImplementation(() => {
      throw new Error('KaTeX error');
    });

    const markdown = '$$\\invalid{formula}$$';
    const { markdown: processed } = processMath(markdown);

    expect(processed).toBe(markdown);

    katexSpy.mockRestore();
  });

  test('should handle katex rendering errors gracefully for inline math', () => {
    const katexSpy = jest.spyOn(katex, 'renderToString').mockImplementation(() => {
      throw new Error('KaTeX error');
    });

    const markdown = 'Some $invalid$ math';
    const { markdown: processed } = processMath(markdown);

    expect(processed).toBe(markdown);

    katexSpy.mockRestore();
  });

  test('should return input unchanged when restoreMath is called with no placeholders', () => {
    const { restoreMath } = processMath('Plain text without math');
    const input = '<p>Plain HTML</p>';
    expect(restoreMath(input)).toBe(input);
  });

  test('should handle missing indices in restoreMath safely', () => {
    const { restoreMath } = processMath('Plain text');
    const htmlWithUnmatchedPlaceholder = '<div>%%MATH_BLOCK_99%% and %%MATH_INLINE_99%%</div>';
    const result = restoreMath(htmlWithUnmatchedPlaceholder);

    expect(result).toBe('<div> and </div>');
  });
});

describe('splitHighlightedLines', () => {
  test('should return [""] for empty or falsy input', () => {
    expect(splitHighlightedLines('')).toEqual(['']);
    expect(splitHighlightedLines(null)).toEqual(['']);
    expect(splitHighlightedLines(undefined)).toEqual(['']);
  });

  test('should handle single-line HTML without span tags', () => {
    expect(splitHighlightedLines('const x = 1;')).toEqual(['const x = 1;']);
  });

  test('should handle multi-line HTML without span tags', () => {
    const input = 'line 1\nline 2\nline 3';
    expect(splitHighlightedLines(input)).toEqual(['line 1', 'line 2', 'line 3']);
  });

  test('should handle single span tag within a single line', () => {
    const input = '<span class="hljs-keyword">const</span> x = 1;';
    expect(splitHighlightedLines(input)).toEqual(['<span class="hljs-keyword">const</span> x = 1;']);
  });

  test('should balance and carry over open span tags across multi-line breaks', () => {
    const input = '<span class="hljs-string">first line\nsecond line</span>';
    const expected = [
      '<span class="hljs-string">first line</span>',
      '<span class="hljs-string">second line</span>'
    ];
    expect(splitHighlightedLines(input)).toEqual(expected);
  });

  test('should handle nested span tags crossing multi-line boundaries', () => {
    const input = '<span class="hljs-function">function <span class="hljs-title">foo</span>(\n  arg1,\n  arg2\n)</span>';
    const expected = [
      '<span class="hljs-function">function <span class="hljs-title">foo</span>(</span>',
      '<span class="hljs-function">  arg1,</span>',
      '<span class="hljs-function">  arg2</span>',
      '<span class="hljs-function">)</span>'
    ];
    expect(splitHighlightedLines(input)).toEqual(expected);
  });

  test('should handle spans without class attribute or with empty class attribute', () => {
    const input = '<span>line 1\nline 2</span>';
    const expected = [
      '<span>line 1</span>',
      '<span class="">line 2</span>'
    ];
    expect(splitHighlightedLines(input)).toEqual(expected);
  });

  test('should handle multi-line HTML where tags open and close across lines', () => {
    const input = '<span class="hljs-comment">/* line 1\n * line 2\n */</span>\nconst x = 1;';
    const expected = [
      '<span class="hljs-comment">/* line 1</span>',
      '<span class="hljs-comment"> * line 2</span>',
      '<span class="hljs-comment"> */</span>',
      'const x = 1;'
    ];
    expect(splitHighlightedLines(input)).toEqual(expected);
  });
});

describe('Extracted Custom Renderer Helper Functions', () => {
  describe('renderHeading', () => {
    test('renders string inputs and populates headings array with correct slug and level', () => {
      const headings = [];
      const slugCounts = {};

      const result = renderHeading(null, slugCounts, headings, 'Section One', 2, 'Section One');
      expect(result).toContain('<h2 id="section-one" class="md-heading md-h2">');
      expect(result).toContain('heading-anchor');
      expect(result).toContain('<span class="heading-text">Section One</span>');
      expect(headings).toEqual([{ level: 2, text: 'Section One', id: 'section-one' }]);
    });

    test('handles token object inputs with custom parser', () => {
      const headings = [];
      const slugCounts = {};
      const mockParser = {
        parseInline: jest.fn().mockReturnValue('<em>Formatted</em> Heading')
      };
      const context = { parser: mockParser };
      const tokenObj = {
        depth: 3,
        tokens: [{ type: 'em', text: 'Formatted' }],
        text: 'Formatted Heading'
      };

      const result = renderHeading(context, slugCounts, headings, tokenObj);
      expect(mockParser.parseInline).toHaveBeenCalledWith(tokenObj.tokens);
      expect(result).toContain('<h3 id="formatted-heading" class="md-heading md-h3">');
      expect(result).toContain('<em>Formatted</em> Heading');
      expect(headings).toEqual([{ level: 3, text: 'Formatted Heading', id: 'formatted-heading' }]);
    });

    test('increments slug counts on duplicate headings', () => {
      const headings = [];
      const slugCounts = {};

      renderHeading(null, slugCounts, headings, 'Overview', 1);
      renderHeading(null, slugCounts, headings, 'Overview', 1);

      expect(headings[0].id).toBe('overview');
      expect(headings[1].id).toBe('overview-1');
    });
  });

  describe('renderCode', () => {
    test('renders mermaid code block wrapper when lang is mermaid', () => {
      const result = renderCode('graph LR; A-->B;', 'mermaid');
      expect(result).toContain('class="mermaid-block-wrapper"');
      expect(result.html || result).toContain('Diagrama Mermaid');
      expect(result).toContain('<div class="mermaid">graph LR; A-->B;</div>');
    });

    test('renders syntax highlighted code block with line numbers for code object', () => {
      const codeObj = { text: 'let y = 10;', lang: 'js' };
      const result = renderCode(codeObj);
      expect(result).toContain('class="code-block-wrapper"');
      expect(result).toContain('<span class="code-lang-badge">js</span>');
      expect(result).toContain('data-line="1"');
      expect(result).toContain('let');
    });
  });

  describe('renderBlockquote', () => {
    test('renders GitHub alert callouts for note, tip, warning, important, caution', () => {
      const alertTypes = ['note', 'tip', 'important', 'warning', 'caution'];
      alertTypes.forEach((type) => {
        const input = `<p>[!${type.toUpperCase()}]\nSome ${type} alert message</p>`;
        const result = renderBlockquote(null, input);
        expect(result).toContain(`class="markdown-alert markdown-alert-${type}"`);
        expect(result).toContain(`Some ${type} alert message`);
      });
    });

    test('renders token object for blockquote using parser', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue('<p>Inside blockquote</p>')
      };
      const context = { parser: mockParser };
      const tokenObj = { tokens: [{ type: 'paragraph' }] };

      const result = renderBlockquote(context, tokenObj);
      expect(mockParser.parse).toHaveBeenCalledWith(tokenObj.tokens);
      expect(result).toBe('<blockquote><p>Inside blockquote</p></blockquote>');
    });
  });

  describe('renderTable', () => {
    test('wraps rendered table HTML in table-responsive container', () => {
      const result = renderTable(null, '<thead><tr><th>Col</th></tr></thead>', '<tbody><tr><td>Val</td></tr></tbody>');
      expect(result).toContain('<div class="table-responsive">');
      expect(result).toContain('</div>');
    });
  });

  describe('renderListitem', () => {
    test('renders task list item when task is true', () => {
      const resultUnchecked = renderListitem(null, 'Do task', true, false);
      expect(resultUnchecked).toContain('class="task-list-item task-unchecked"');
      expect(resultUnchecked).toContain('<input type="checkbox" class="task-checkbox"  disabled />');
      expect(resultUnchecked).toContain('Do task');

      const resultChecked = renderListitem(null, 'Done task', true, true);
      expect(resultChecked).toContain('class="task-list-item task-checked"');
      expect(resultChecked).toContain('checked');
    });

    test('renders standard list item when not a task', () => {
      const result = renderListitem(null, 'Simple item');
      expect(result).toBe('<li>Simple item</li>');
    });
  });

  describe('renderLink', () => {
    test('renders external links with target=_blank and external icon', () => {
      const result = renderLink(null, 'https://example.com', 'Example', 'Click Here');
      expect(result).toContain('class="external-link"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('title="Example"');
      expect(result).toContain('Click Here');
      expect(result).toContain('external-icon');
    });

    test('renders anchor links for relative hash hrefs', () => {
      const result = renderLink(null, '#section', '', 'Section');
      expect(result).toContain('class="anchor-link"');
      expect(result).toContain('href="#section"');
    });

    test('renders internal links with data-local-path attribute', () => {
      const result = renderLink(null, 'doc.md', '', 'Document');
      expect(result).toContain('class="internal-link"');
      expect(result).toContain('data-local-path="doc.md"');
    });
  });

  describe('renderImage', () => {
    test('renders image figure with img and optional figcaption', () => {
      const result = renderImage(null, 'img.png', 'Caption Title', 'Alt Description');
      expect(result).toContain('<figure class="md-image-figure">');
      expect(result).toContain('<img src="img.png" alt="Alt Description" title="Caption Title" class="md-image" loading="lazy" />');
      expect(result).toContain('<figcaption class="md-image-caption">Alt Description</figcaption>');
    });

    test('omits figcaption if alt text is default Imagem or empty', () => {
      const result = renderImage(null, 'img.png', '', 'Imagem');
      expect(result).not.toContain('<figcaption');
    });
  });

  describe('createCustomRenderer integration', () => {
    test('constructs a marked Renderer with bound helper methods', () => {
      const headings = [];
      const renderer = createCustomRenderer(headings);

      expect(typeof renderer.heading).toBe('function');
      expect(typeof renderer.code).toBe('function');
      expect(typeof renderer.blockquote).toBe('function');
      expect(typeof renderer.table).toBe('function');
      expect(typeof renderer.listitem).toBe('function');
      expect(typeof renderer.link).toBe('function');
      expect(typeof renderer.image).toBe('function');
    });
  });
});
