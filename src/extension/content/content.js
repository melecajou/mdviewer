// MDViewer Chrome Extension - Content Script

(function() {
  'use strict';

  // Verificar se já foi inicializado
  if (window.__MDVIEWER_INITIALIZED__) return;

  // Verificar se o documento atual é um arquivo Markdown em texto bruto
  function isMarkdownDocument() {
    const pathname = window.location.pathname.toLowerCase();
    const isMdUrl = pathname.endsWith('.md') || pathname.endsWith('.markdown') || pathname.endsWith('.mdown');
    
    // Chrome normalmente encapsula texto puro em um único <pre>
    const body = document.body;
    if (!body) return false;

    const pre = body.querySelector('pre');
    const isPlainText = document.contentType === 'text/plain' || 
                        document.contentType === 'text/markdown' || 
                        document.contentType === 'text/x-markdown';

    // Se for URL .md ou texto puro com <pre>
    if (isMdUrl && (pre || body.children.length <= 2)) {
      return true;
    }

    if (isPlainText && pre) {
      return true;
    }

    return false;
  }

  // Obter texto bruto original
  function extractRawText() {
    let rawText = '';
    const existingPre = document.querySelector('body > pre');
    if (existingPre) {
      rawText = existingPre.textContent;
      existingPre.style.display = 'none';
    } else {
      rawText = document.body.innerText || '';
      document.body.innerHTML = '';
    }
    return rawText;
  }

  // Nome do arquivo seguro
  function getSafeFilename() {
    const filename = decodeURIComponent(window.location.pathname.split('/').pop()) || 'documento.md';
    const safeFilename = MDViewerBase.escapeHtml(filename);
    return { filename, safeFilename };
  }

  // Criar interface do MDViewer
  function createUIContainer(safeFilename) {
    document.body.classList.add('mdviewer-injected-body');

    const root = document.createElement('div');
    root.className = 'mdviewer-content-root';

    root.innerHTML = `
    <div class="mdviewer-floating-toolbar">
      <div class="mdviewer-toolbar-left">
        <span class="mdviewer-badge">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM1.5 6v8.25c0 .138.112.25.25.25H5V6ZM6.5 6v8.5h7.75a.25.25 0 0 0 .25-.25V6ZM14.5 4.5V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V4.5Z"/>
          </svg>
          MDViewer
        </span>
        <span class="mdviewer-doc-title" title="${safeFilename}">${safeFilename}</span>
      </div>

      <div class="mdviewer-toolbar-right">
        <!-- Alternar TOC -->
        <button id="mdviewer-btn-toc" class="mdviewer-btn" title="Alternar Sumário">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M2 3.75C2 3.336 2.336 3 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4C2 7.336 2.336 7 2.75 7h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 7.75Zm0 4c0-.414.336-.75.75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"/></svg>
          <span>Sumário</span>
        </button>

        <!-- Alternar Código Fonte / Visualização -->
        <button id="mdviewer-btn-mode" class="mdviewer-btn" title="Alternar Código Fonte">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.06 1.06L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25Z"/></svg>
          <span id="mdviewer-btn-mode-text">Fonte</span>
        </button>

        <!-- Seletor de Tema -->
        <select id="mdviewer-toolbar-theme" class="mdviewer-select" title="Alterar Tema">
          <option value="github-dark">GitHub Dark</option>
          <option value="github-light">GitHub Light</option>
          <option value="dracula">Dracula</option>
          <option value="nord">Nord</option>
          <option value="one-dark">One Dark</option>
          <option value="sepia">Sépia</option>
          <option value="monokai">Monokai</option>
        </select>

        <!-- Imprimir / PDF -->
        <button id="mdviewer-btn-print" class="mdviewer-btn" title="Imprimir / Exportar PDF">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M1.75 2.5h10.5a.25.25 0 0 1 .25.25v10.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25V2.75a.25.25 0 0 1 .25-.25ZM3.5 5.5v5h1.5v-1.5h1a1.5 1.5 0 0 0 0-3H3.5Zm1.5 1.25h1a.25.25 0 0 1 0 .5H5v-.5Z"/></svg>
          <span>PDF</span>
        </button>

        <!-- Abrir no Workspace -->
        <button id="mdviewer-btn-workspace" class="mdviewer-btn" style="background-color: #238636; border-color: rgba(240,246,252,0.1); color: #fff;" title="Abrir no Espaço de Trabalho Completo">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.5.75a.75.75 0 0 1 .75-.75h4.25c.414 0 .75.336.75.75v4.25a.75.75 0 0 1-1.5 0V3.56L9.53 8.53a.75.75 0 0 1-1.06-1.06L13.44 2.5H11a.75.75 0 0 1-.75-.75Z"/></svg>
          <span>Workspace</span>
        </button>
      </div>
    </div>

    <div class="mdviewer-document-layout">
      <main class="mdviewer-main-article">
        <div class="markdown-body" id="mdviewer-rendered-content"></div>
        <pre class="mdviewer-raw-view" id="mdviewer-raw-view"></pre>
      </main>

      <aside class="mdviewer-toc-sidebar" id="mdviewer-toc-sidebar">
        <div class="mdviewer-toc-title">Sumário</div>
        <nav id="mdviewer-toc-nav"></nav>
      </aside>
    </div>
  `;

    document.body.appendChild(root);

    return {
      renderedContent: document.getElementById('mdviewer-rendered-content'),
      rawView: document.getElementById('mdviewer-raw-view'),
      tocSidebar: document.getElementById('mdviewer-toc-sidebar'),
      tocNav: document.getElementById('mdviewer-toc-nav'),
      btnToc: document.getElementById('mdviewer-btn-toc'),
      btnMode: document.getElementById('mdviewer-btn-mode'),
      btnModeText: document.getElementById('mdviewer-btn-mode-text'),
      themeSelect: document.getElementById('mdviewer-toolbar-theme'),
      btnPrint: document.getElementById('mdviewer-btn-print'),
      btnWorkspace: document.getElementById('mdviewer-btn-workspace')
    };
  }

  // Inicializar configurações e listener de tema
  function initTheme(themeSelect) {
    let currentTheme = 'github-dark';
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['theme'], (result) => {
        if (result && result.theme) {
          currentTheme = result.theme;
          document.documentElement.setAttribute('data-theme', currentTheme);
          if (themeSelect) themeSelect.value = currentTheme;
        }
      });
    }

    document.documentElement.setAttribute('data-theme', currentTheme);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes.theme) {
          document.documentElement.setAttribute('data-theme', changes.theme.newValue);
          if (themeSelect) themeSelect.value = changes.theme.newValue;
        }
      });
    }
  }

  // Gerar TOC
  function renderToc(headings, tocNav) {
    if (!headings || headings.length === 0) {
      tocNav.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">Nenhum título encontrado</span>`;
      return;
    }

    tocNav.innerHTML = headings.map(h => {
      const safeText = MDViewerBase.escapeHtml(h.text);
      return `
      <a href="#${h.id}" class="mdviewer-toc-link level-${Math.min(h.level, 4)}" title="${safeText}">
        ${safeText}
      </a>
    `;
    }).join('');
  }

  // Renderizar o markdown
  function renderMarkdownContent(text, elements) {
    const { renderedContent, rawView, tocNav } = elements;

    if (!window.MDViewerEngine || !window.MDViewerEngine.parseMarkdown) {
      renderedContent.innerHTML = `<p>Erro: Motor de renderização do MDViewer não foi carregado.</p>`;
      return;
    }

    const purify = window.DOMPurify || (typeof DOMPurify !== 'undefined' ? DOMPurify : null);
    if (!purify || typeof purify.sanitize !== 'function') {
      renderedContent.innerHTML = `<p>Erro: Biblioteca de sanitização (DOMPurify) não foi carregada. Renderização cancelada por segurança.</p>`;
      return;
    }

    const { html, headings } = window.MDViewerEngine.parseMarkdown(text);

    // Inject HTML (Sanitized to prevent XSS)
    const sanitizedHtml = purify.sanitize(html, {
      USE_PROFILES: { html: true }
    });

    renderedContent.innerHTML = sanitizedHtml;
    rawView.textContent = text;

    // Attach heading anchor copy link
    const headingAnchors = renderedContent.querySelectorAll('.heading-anchor');
    headingAnchors.forEach(anchor => {
      anchor.addEventListener('click', () => {
        const id = anchor.parentElement.id;
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + window.location.search + '#' + id);
      });
    });

    // Renderizar Mermaid
    if (window.mermaid) {
      try {
        const isDark = !document.documentElement.getAttribute('data-theme')?.includes('light');
        window.mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'strict'
        });
        window.mermaid.run({
          nodes: renderedContent.querySelectorAll('.mermaid')
        });
      } catch {
      }
    }

    // Gerar TOC
    renderToc(headings, tocNav);

    // Conectar botões de copiar código
    renderedContent.querySelectorAll('.copy-code-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = decodeURIComponent(btn.getAttribute('data-code') || '');
        MDViewerBase.prototype.copyToClipboard(code, { button: btn, copiedText: 'Copiado!', timeout: 1800 });
      });
    });
  }

  // Conectar eventos dos elementos da interface
  function attachEventListeners(elements, state, docInfo) {
    const {
      btnToc,
      btnMode,
      btnModeText,
      themeSelect,
      btnPrint,
      btnWorkspace,
      tocSidebar,
      renderedContent,
      rawView
    } = elements;

    btnToc.addEventListener('click', () => {
      tocSidebar.classList.toggle('visible');
    });

    btnMode.addEventListener('click', () => {
      state.isSourceMode = !state.isSourceMode;
      if (state.isSourceMode) {
        renderedContent.style.display = 'none';
        rawView.style.display = 'block';
        btnModeText.textContent = 'Visualizar';
      } else {
        renderedContent.style.display = 'block';
        rawView.style.display = 'none';
        btnModeText.textContent = 'Fonte';
      }
    });

    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.setAttribute('data-theme', theme);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ theme });
      }
    });

    btnPrint.addEventListener('click', () => {
      window.print();
    });

    btnWorkspace.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'openViewer',
          url: window.location.href,
          content: state.rawText,
          filename: docInfo.filename
        });
      }
    });

    // Auto-reload em URLs file:/// ao recuperar o foco da janela
    if (window.location.protocol === 'file:') {
      window.addEventListener('focus', async () => {
        try {
          const response = await fetch(window.location.href, { cache: 'no-store' });
          if (response.ok) {
            const freshText = await response.text();
            if (freshText && freshText !== state.rawText) {
              state.rawText = freshText;
              renderMarkdownContent(state.rawText, elements);
            }
          }
        } catch {
          // Ignora erros de permissão ou CORS
        }
      });
    }
  }

  // Inicialização do content script
  function initContentScript() {
    if (!isMarkdownDocument()) {
      return;
    }

    window.__MDVIEWER_INITIALIZED__ = true;

    const rawText = extractRawText();
    const docInfo = getSafeFilename();
    const elements = createUIContainer(docInfo.safeFilename);

    const state = {
      rawText,
      isSourceMode: false
    };

    initTheme(elements.themeSelect);
    attachEventListeners(elements, state, docInfo);
    renderMarkdownContent(state.rawText, elements);
  }

  initContentScript();
})();
