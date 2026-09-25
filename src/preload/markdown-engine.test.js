const hljs = require('highlight.js');
const { slugify, parseMarkdown } = require('./markdown-engine');

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
});
