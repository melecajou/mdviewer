const { marked } = require('marked');
const hljs = require('highlight.js');
const katex = require('katex');

// Alert types and icons SVG
const ALERT_ICONS = {
  note: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
  tip: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.21c-.04-.282-.163-.554-.367-.85a5.5 5.5 0 0 0-.742-.935l-.213-.252C3.003 7.502 2.5 6.574 2.5 5.25 2.5 2.378 4.872 0 8 0s5.5 2.378 5.5 5.25c0 1.324-.503 2.252-1.165 3.048l-.213.252c-.23.272-.49.577-.742.935-.204.296-.327.568-.367.85a.75.75 0 0 1-1.484-.21c.084-.594.337-1.079.621-1.49.203-.292.45-.584.673-.848l.214-.253c.56-.679.984-1.32.984-2.304 0-2.06-1.637-3.75-4-3.75ZM6 13.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 15.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z"/></svg>`,
  important: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h3a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h5.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm6.25 2a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 3.5ZM8 10a1 1 0 1 1 0-2 1 1 0 0 1 2 0Z"/></svg>`,
  warning: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`,
  caution: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`
};

const ALERT_TITLES = {
  note: 'Nota',
  tip: 'Dica',
  important: 'Importante',
  warning: 'Aviso',
  caution: 'Cuidado'
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .replace(/[^\w\s\u00C0-\u00FF-]/g, '') // keep alphanumeric and accents
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function processMath(markdown) {
  const mathBlocks = [];
  const mathInlines = [];

  // Protect code blocks and inline code from math processing
  const codePlaceholders = [];
  let protectedMarkdown = markdown.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const placeholder = `%%CODE_PLACEHOLDER_${codePlaceholders.length}%%`;
    codePlaceholders.push(match);
    return placeholder;
  });

  // Extract and render Block Math: $$...$$
  protectedMarkdown = protectedMarkdown.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false
      });
      const placeholder = `%%MATH_BLOCK_${mathBlocks.length}%%`;
      mathBlocks.push(`<div class="katex-block">${rendered}</div>`);
      return placeholder;
    } catch (e) {
      return match;
    }
  });

  // Extract and render Inline Math: $...$ (ensure not double $ and not empty)
  protectedMarkdown = protectedMarkdown.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, formula) => {
    // Avoid pure numbers with currency symbol like $50 or $100.00
    if (/^\d+(\.\d+)?$/.test(formula.trim())) {
      return match;
    }
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false
      });
      const placeholder = `%%MATH_INLINE_${mathInlines.length}%%`;
      mathInlines.push(`${prefix}<span class="katex-inline">${rendered}</span>`);
      return placeholder;
    } catch (e) {
      return match;
    }
  });

  // Restore code blocks
  let restored = protectedMarkdown.replace(/%%CODE_PLACEHOLDER_(\d+)%%/g, (_, idx) => codePlaceholders[idx]);

  return {
    markdown: restored,
    restoreMath: (html) => {
      let res = html;
      res = res.replace(/%%MATH_BLOCK_(\d+)%%/g, (_, idx) => mathBlocks[idx] || '');
      res = res.replace(/%%MATH_INLINE_(\d+)%%/g, (_, idx) => mathInlines[idx] || '');
      return res;
    }
  };
}

/**
 * Splits highlighted HTML into lines while keeping syntax highlighting
 * span tags balanced and properly carried over across line breaks.
 */
function splitHighlightedLines(html) {
  if (!html) return [''];
  const lines = html.split('\n');
  const result = [];
  const openTags = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prefix = openTags.map(cls => `<span class="${cls}">`).join('');

    const tagRegex = /<(\/)?span(?: class="([^"]*)")?>/g;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      if (match[1] === '/') {
        openTags.pop();
      } else {
        openTags.push(match[2] || '');
      }
    }

    const suffix = openTags.map(() => '</span>').join('');
    result.push(prefix + line + suffix);
  }
  return result;
}

function parseMarkdown(rawContent, options = {}) {
  const headings = [];
  const slugCounts = {};

  const { markdown: preparedMarkdown, restoreMath } = processMath(rawContent);

  // Configure marked custom renderer
  const renderer = new marked.Renderer();

  // Custom heading renderer with slug & outline extraction
  renderer.heading = function (textOrObj, levelOrUndefined, rawOrUndefined) {
    let renderedText = '';
    let depth = 1;
    let rawText = '';

    if (typeof textOrObj === 'object' && textOrObj !== null) {
      depth = textOrObj.depth || 1;
      renderedText = (this.parser && textOrObj.tokens) ? this.parser.parseInline(textOrObj.tokens) : (textOrObj.text || '');
      rawText = renderedText.replace(/<[^>]+>/g, '').trim();
    } else {
      renderedText = String(textOrObj || '');
      depth = levelOrUndefined || 1;
      rawText = (rawOrUndefined || renderedText).replace(/<[^>]+>/g, '').trim();
    }

    let baseSlug = slugify(rawText) || `heading-${depth}`;
    
    if (slugCounts[baseSlug] !== undefined) {
      slugCounts[baseSlug]++;
      baseSlug = `${baseSlug}-${slugCounts[baseSlug]}`;
    } else {
      slugCounts[baseSlug] = 0;
    }

    headings.push({
      level: depth,
      text: rawText,
      id: baseSlug
    });

    return `
      <h${depth} id="${baseSlug}" class="md-heading md-h${depth}">
        <span class="heading-anchor" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${baseSlug}')" title="Copiar link da seção">#</span>
        <span class="heading-text">${renderedText}</span>
      </h${depth}>
    `;
  };

  // Custom code block renderer with highlight.js & Mermaid support
  renderer.code = function (codeOrObj, infostringOrUndefined, escapedOrUndefined) {
    let code = '';
    let lang = '';
    if (typeof codeOrObj === 'object' && codeOrObj !== null) {
      code = codeOrObj.text || '';
      lang = codeOrObj.lang || '';
    } else {
      code = codeOrObj || '';
      lang = infostringOrUndefined || '';
    }
    const cleanLang = (lang || '').trim().toLowerCase();

    // Check for Mermaid diagram
    if (cleanLang === 'mermaid') {
      return `
        <div class="mermaid-block-wrapper">
          <div class="mermaid-header">
            <span class="mermaid-badge">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.44 5.337A2.25 2.25 0 1 1 8.38 6.4l-2.264-2.264a.75.75 0 0 1 1.06-1.063Zm2.263 7.49 2.264 2.263a.75.75 0 1 1-1.06 1.06l-2.265-2.263a2.25 2.25 0 1 1 1.06-1.06Z"/></svg>
              Diagrama Mermaid
            </span>
          </div>
          <div class="mermaid">${code}</div>
        </div>
      `;
    }

    let highlighted = '';
    let languageLabel = cleanLang || 'texto';

    if (cleanLang && hljs.getLanguage(cleanLang)) {
      try {
        highlighted = hljs.highlight(code, { language: cleanLang, ignoreIllegals: true }).value;
      } catch (err) {
        highlighted = hljs.highlightAuto(code).value;
      }
    } else if (code.trim()) {
      try {
        const auto = hljs.highlightAuto(code);
        highlighted = auto.value;
        if (auto.language) {
          languageLabel = auto.language;
        }
      } catch (err) {
        highlighted = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
    } else {
      highlighted = '';
    }

    // Add line numbers safely preserving syntax spans across lines without extra whitespace
    const lines = splitHighlightedLines(highlighted);
    const numberedLines = lines.map((line, idx) => `<div class="code-line"><span class="line-number" data-line="${idx + 1}"></span><span class="line-content">${line}</span></div>`).join('');

    const escapedRawCode = encodeURIComponent(code);

    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-lang-badge">${languageLabel}</span>
          <button class="copy-code-button" data-code="${escapedRawCode}" title="Copiar código">
            <svg class="copy-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
            </svg>
            <span class="copy-text">Copiar</span>
          </button>
        </div>
        <pre class="hljs-pre"><code class="hljs ${cleanLang ? `language-${cleanLang}` : ''}">${numberedLines}</code></pre>
      </div>
    `;
  };

  // Custom blockquote renderer with GitHub Callouts / Alerts support
  renderer.blockquote = function (quoteOrObj) {
    let body = '';
    if (typeof quoteOrObj === 'object' && quoteOrObj !== null) {
      body = (this.parser && quoteOrObj.tokens) ? this.parser.parse(quoteOrObj.tokens) : (quoteOrObj.text || '');
    } else {
      body = quoteOrObj || '';
    }
    const alertMatch = body.match(/^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br>|\n)?([\s\S]*?)<\/p>/i);
    if (alertMatch) {
      const alertType = alertMatch[1].toLowerCase();
      const remainingContent = alertMatch[2] || '';
      const icon = ALERT_ICONS[alertType] || ALERT_ICONS.note;
      const title = ALERT_TITLES[alertType] || 'Nota';

      return `
        <div class="markdown-alert markdown-alert-${alertType}">
          <div class="markdown-alert-header">
            <span class="markdown-alert-icon">${icon}</span>
            <span class="markdown-alert-title">${title}</span>
          </div>
          <div class="markdown-alert-body">
            ${remainingContent ? `<p>${remainingContent}</p>` : ''}
          </div>
        </div>
      `;
    }
    return `<blockquote>${body}</blockquote>`;
  };

  // Custom table renderer wrapped in responsive container
  renderer.table = function (headerOrObj, bodyOrUndefined) {
    let html = '';
    if (typeof headerOrObj === 'object' && headerOrObj !== null && bodyOrUndefined === undefined) {
      html = marked.Renderer.prototype.table.call(this, headerOrObj);
    } else {
      html = marked.Renderer.prototype.table.call(this, headerOrObj, bodyOrUndefined);
    }
    return `<div class="table-responsive">${html}</div>`;
  };

  // Custom listitem renderer
  renderer.listitem = function (textOrObj, taskOrUndefined, checkedOrUndefined) {
    let content = '';
    let isTask = false;
    let isChecked = false;

    if (typeof textOrObj === 'object' && textOrObj !== null) {
      content = (this.parser && textOrObj.tokens) ? this.parser.parse(textOrObj.tokens) : (textOrObj.text || '');
      isTask = !!textOrObj.task;
      isChecked = !!textOrObj.checked;
    } else {
      content = textOrObj || '';
      isTask = !!taskOrUndefined;
      isChecked = !!checkedOrUndefined;
    }

    if (isTask) {
      return `
        <li class="task-list-item ${isChecked ? 'task-checked' : 'task-unchecked'}">
          <label class="task-label">
            <input type="checkbox" class="task-checkbox" ${isChecked ? 'checked' : ''} disabled />
            <span class="task-box"></span>
            <span class="task-text">${content}</span>
          </label>
        </li>
      `;
    }
    return `<li>${content}</li>`;
  };

  // Custom link renderer (handles local .md files vs external URLs)
  renderer.link = function (hrefOrObj, titleOrUndefined, textOrUndefined) {
    let href = '';
    let title = '';
    let text = '';

    if (typeof hrefOrObj === 'object' && hrefOrObj !== null) {
      href = hrefOrObj.href || '';
      title = hrefOrObj.title || '';
      text = (this.parser && hrefOrObj.tokens) ? this.parser.parseInline(hrefOrObj.tokens) : (hrefOrObj.text || '');
    } else {
      href = hrefOrObj || '';
      title = titleOrUndefined || '';
      text = textOrUndefined || '';
    }

    const safeTitle = title ? ` title="${title}"` : '';
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'));
    const isAnchor = href && href.startsWith('#');
    
    if (isExternal) {
      return `<a href="${href}"${safeTitle} class="external-link" target="_blank" rel="noopener noreferrer">${text}<svg class="external-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.5.75a.75.75 0 0 1 .75-.75h4.25c.414 0 .75.336.75.75v4.25a.75.75 0 0 1-1.5 0V3.56L9.53 8.53a.75.75 0 0 1-1.06-1.06L13.44 2.5H11a.75.75 0 0 1-.75-.75Z"/></svg></a>`;
    } else if (isAnchor) {
      return `<a href="${href}"${safeTitle} class="anchor-link">${text}</a>`;
    } else {
      return `<a href="${href}"${safeTitle} class="internal-link" data-local-path="${href}">${text}</a>`;
    }
  };

  // Custom image renderer with lightbox data attribute
  renderer.image = function (hrefOrObj, titleOrUndefined, textOrUndefined) {
    let href = '';
    let title = '';
    let text = '';

    if (typeof hrefOrObj === 'object' && hrefOrObj !== null) {
      href = hrefOrObj.href || '';
      title = hrefOrObj.title || '';
      text = (hrefOrObj.tokens && this.parser) ? this.parser.parseInline(hrefOrObj.tokens, this.parser.textRenderer) : (hrefOrObj.text || 'Imagem');
    } else {
      href = hrefOrObj || '';
      title = titleOrUndefined || '';
      text = textOrUndefined || 'Imagem';
    }

    const safeTitle = title ? ` title="${title}"` : '';
    const altText = text || 'Imagem';
    return `
      <figure class="md-image-figure">
        <img src="${href}" alt="${altText}"${safeTitle} class="md-image" loading="lazy" />
        ${altText && altText !== 'Imagem' ? `<figcaption class="md-image-caption">${altText}</figcaption>` : ''}
      </figure>
    `;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false
  });

  let rawHtml = marked.parse(preparedMarkdown, { renderer });
  let finalHtml = restoreMath(rawHtml);

  // Calculate statistics
  const plainText = rawContent
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/[#*`_~\[\]()><]/g, '') // remove markdown symbols
    .trim();
  
  const words = plainText.length > 0 ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const chars = rawContent.length;
  const lines = rawContent.split('\n').length;
  const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    html: finalHtml,
    headings,
    stats: {
      words,
      chars,
      lines,
      readTimeMinutes
    }
  };
}

module.exports = {
  parseMarkdown,
  slugify
};
