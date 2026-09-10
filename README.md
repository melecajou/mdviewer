# 📖 MDViewer

> **MDViewer** é um visualizador e editor de arquivos Markdown moderno, rápido, multiplataforma e elegante. Desenvolvido para oferecer renderização impecável (GitHub Flavored Markdown, Mermaid, KaTeX, Callouts) e edição interativa em tempo real para **Desktop (Linux e Windows 11)** e como **Extensão para Google Chrome / Chromium**.

![MDViewer Icon](src/assets/icon.svg)

---

## ✨ Recursos

### ✏️ Editor Interativo & Barra de Ferramentas Visual
- **Edição em Tempo Real**: Alterne com fluidez entre leitura pura, modo dividido (Split View) e edição de código fonte.
- **Barra de Ferramentas Visual**: Insira formatações com 1 clique (Negrito, Itálico, Riscado, Títulos H1-H6, Citação, Código em linha, Bloco de código, Listas com marcadores, Listas numeradas, Checklists, Links, Imagens e Tabelas).
- **Digitação Inteligente**:
  - Indentação de linha e em bloco via `Tab` / `Shift+Tab`.
  - Continuação automática de listas (`- `, `* `, `1. `, `- [ ] `) ao teclar `Enter`.
  - Histórico nativo de desfazer/refazer (`Ctrl+Z` / `Ctrl+Y`).
- **Checklists Interativas no Preview**: Marque ou desmarque caixas de seleção diretamente no painel renderizado; o arquivo Markdown é atualizado automaticamente.
- **Políticas de Salvamento Seguro**:
  - Salvamento exclusivamente manual (`Ctrl+S`, menu ou botão da barra).
  - Indicador de modificações não salvas (`●` nas abas e asterisco no título da janela).
  - Prevenção de loop no File Watcher ao salvar localmente pelo próprio editor.
  - Diálogo de confirmação para salvar alterações antes de fechar abas ou fechar a janela.

### ⚡ Renderização Completa GitHub Flavored Markdown (GFM)
- Tabelas responsivas com alinhamento de colunas.
- Listas de tarefas (*task lists*) com caixas de seleção interativas.
- Navegação direta entre arquivos `.md` locais e links externos.
- Quebras de linha suaves, tipografia refinada e citações estilizadas.

### 🎨 7 Temas Visuais Modernos
- `GitHub Dark` (padrão escuro)
- `GitHub Light` (modo claro)
- `Dracula`
- `Nord`
- `One Dark`
- `Sépia` (ideal para leitura confortável)
- `Monokai`

### 📊 Diagramas Mermaid Integrados
- Renderização em tempo real de fluxogramas (`graph TD`), diagramas de sequência (`sequenceDiagram`), grafos Git, diagramas de classe, de estado e gráficos de Gantt diretamente a partir de blocos `mermaid`.

### 🧮 Fórmulas Matemáticas LaTeX (KaTeX)
- Equações em linha (`$E = mc^2$`) e blocos destacados (`$$\int_0^\infty ...$$`) com renderização matemática de alto desempenho.

### 💡 Alertas e Callouts do GitHub
- Suporte nativo aos callouts visuais: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]` e `> [!CAUTION]`.

### 💻 Realce de Sintaxe Avançado (Highlight.js)
- Destaque para mais de 100 linguagens de programação.
- Numeração de linhas e botão de **Copiar Código** com 1 clique.

### 🔄 Live Sync & Auto-Reload em Tempo Real
- Monitoramento do sistema de arquivos via **Chokidar**. Se o arquivo for modificado por outro editor (VS Code, Vim, Nano, etc.), o MDViewer atualiza a exibição automaticamente sem perder a posição de rolagem.
- Proteção concorrente: não substitui seu trabalho se você estiver com alterações não salvas no MDViewer.

### 📑 Interface com Múltiplas Abas & Navegação
- Abra múltiplos arquivos simultaneamente em abas independentes.
- **Barra Lateral com 3 Modos**:
  - **Explorador de Arquivos**: Árvore hierárquica de pastas expansíveis com ordenação alfabética e numérica natural.
  - **Sumário / TOC (Table of Contents)**: Índice interativo de cabeçalhos (H1 a H6) que acompanha a rolagem.
  - **Arquivos Recentes**: Acesso rápido aos últimos documentos abertos.

### 🔀 3 Modos de Visualização
- **Modo Visualização** (`Alt+1`): Foco total na leitura do documento renderizado.
- **Modo Dividido / Split** (`Alt+2`): Editor à esquerda e visualização em tempo real à direita, com sincronização bidirecional de rolagem.
- **Modo Código Fonte** (`Alt+3`): Editor em largura total para escrita e formatação do texto puro.

### 🔍 Localizador no Documento (`Ctrl+F`)
- Busca rápida com destaque de termos, contador de ocorrências e navegação por atalhos.

### 🖨️ Exportação Profissional
- **Exportar como PDF**: Diálogo de impressão nativo com paginação de alta fidelidade.
- **Exportar como HTML**: Gera arquivo HTML autônomo com estilos embutidos pronto para compartilhamento ou publicação.

### 🖼️ Lightbox para Imagens
- Clique em imagens no Markdown para expandir em tela cheia com alta resolução e fundo escurecido.

---

## 🚀 Como Executar e Instalar

### 1. 🐧 Desktop Linux

#### Via linha de comando:
```bash
# Execução no ambiente de desenvolvimento:
npm start

# Ou abrir um arquivo específico via CLI instalado:
mdviewer meuarquivo.md

# Ou abrir uma pasta no explorador lateral:
mdviewer /caminho/para/pasta
```

#### Instalação global no sistema:
O script `install.sh` registra o executável em `~/.local/bin/mdviewer`, os ícones multirresolução em `~/.local/share/icons/hicolor/` e cria a entrada no lançador de aplicativos do sistema (GNOME, KDE, XFCE, etc.):
```bash
./install.sh
```

---

### 2. 🪟 Desktop Windows 11

O MDViewer possui suporte nativo para Windows 11, incluindo ícone multirresolução `.ico`, menus nativos escuros e suporte a caminhos com letras de unidade (`C:\...`).

#### Gerar instaladores do Windows:
```bash
# Gera o instalador .exe (NSIS) e o executável portátil em dist/desktop/
npm run build:win

# Ou para gerar apenas o diretório descompactado (mais rápido):
npm run pack:win
```

#### Binários gerados em `dist/desktop/`:
- **`MDViewer Setup 1.0.0.exe`**: Instalador completo padrão Windows com criação de atalhos no Menu Iniciar e Desktop, além da associação automática de arquivos `.md` e `.markdown`.
- **`MDViewer 1.0.0.exe`**: Versão portátil independente (*Portable*) — execute diretamente sem instalação.

#### Execução via CLI no Windows:
- Via Prompt de Comando (CMD): `bin\mdviewer.cmd meuarquivo.md`
- Via PowerShell: `.\bin\mdviewer.ps1 meuarquivo.md`

---

### 3. 🌐 Extensão para Google Chrome / Chromium (Manifest V3)

A extensão permite usar o MDViewer diretamente no navegador com suporte a abas, editor interativo, árvore de arquivos e abertura de arquivos locais (`file:///`):

1. **Compilar o pacote da extensão**:
   ```bash
   npm run build:extension
   ```
2. **Carregar no Chrome / Brave / Edge**:
   - Abra o navegador e acesse `chrome://extensions`
   - Ative o **"Modo do desenvolvedor"** no canto superior direito
   - Clique em **"Carregar sem compactação"**
   - Selecione a pasta `dist/extension/` (ou descompacte `dist/mdviewer-chrome-extension.zip`)
3. **Ativar Acesso a Arquivos Locais**:
   - Na página da extensão em `chrome://extensions`, clique em **"Detalhes"**
   - Ative a chave **"Permitir acesso aos URLs do arquivo"**
   - Agora qualquer arquivo Markdown aberto no navegador ou arrastado para ele será renderizado e editável com todos os recursos do MDViewer!

---

## ⌨️ Atalhos de Teclado

### Atalhos Gerais e Navegação
| Atalho | Ação |
| :--- | :--- |
| `Ctrl + O` | Abrir Arquivo Markdown |
| `Ctrl + Shift + O` | Abrir Pasta no Explorador Lateral |
| `Ctrl + W` | Fechar Aba Atual |
| `Ctrl + R` | Recarregar Arquivo |
| `Ctrl + F` | Localizar Texto no Documento |
| `Ctrl + P` | Imprimir / Exportar para PDF |
| `Ctrl + Shift + E` | Exportar como HTML Autônomo |
| `Ctrl + B` | Alternar Barra Lateral (quando fora do editor) |
| `Ctrl + Shift + T` | Alternar para o Índice (TOC) |
| `Alt + 1` | Alternar para Modo Visualização (Preview) |
| `Alt + 2` | Alternar para Modo Dividido (Split View) |
| `Alt + 3` | Alternar para Modo Código Fonte (Editor) |
| `Ctrl + +` / `Ctrl + -` | Aumentar / Diminuir Zoom |
| `Ctrl + 0` | Restaurar Zoom Original (100%) |
| `F1` | Exibir Painel de Atalhos de Teclado |
| `F11` | Alternar Tela Cheia |

### Atalhos de Edição
| Atalho | Ação |
| :--- | :--- |
| `Ctrl + N` | Criar Novo Arquivo Markdown |
| `Ctrl + S` | Salvar Arquivo Atual no Disco |
| `Ctrl + Shift + S` | Salvar Arquivo Como... |
| `Ctrl + B` | Aplicar Negrito (`**texto**`) |
| `Ctrl + I` | Aplicar Itálico (`*texto*`) |
| `Ctrl + K` | Inserir Link (`[texto](url)`) |
| `Tab` | Indentar linha ou seleção em bloco (2 espaços) |
| `Shift + Tab` | Desindentar linha ou seleção em bloco |
| `Enter` | Continuar automaticamente listas (`-`, `*`, `1.`, `- [ ]`) |
| `Ctrl + Z` / `Ctrl + Y` | Desfazer / Refazer |

---

## 📁 Estrutura do Repositório

```
mdviewer/
├── bin/
│   ├── mdviewer              # Lançador de linha de comando para Linux / macOS
│   ├── mdviewer.cmd          # Lançador de linha de comando para Windows (CMD)
│   └── mdviewer.ps1          # Lançador de linha de comando para Windows (PowerShell)
├── build-extension.js        # Script de build e empacotamento da extensão Chrome
├── install.sh                # Script de instalação e integração no Desktop Linux
├── mdviewer.desktop          # Lançador .desktop do Linux
├── package.json              # Dependências, scripts npm e configuração electron-builder
├── sample.md                 # Documento de demonstração de todos os recursos
├── src/
│   ├── assets/
│   │   ├── icon.svg          # Ícone vetorial SVG do MDViewer
│   │   ├── icon.png          # Ícone PNG em alta resolução
│   │   └── icon.ico          # Ícone multirresolução para Windows
│   ├── extension/            # Código fonte da Extensão Chrome (Manifest V3)
│   │   ├── manifest.json     # Manifesto V3 da extensão
│   │   ├── background.js     # Service worker
│   │   ├── content.js        # Script injetado para visualização inline de arquivos .md
│   │   └── viewer/           # Workspace completo da extensão (HTML, CSS e JS)
│   ├── main/                 # Processo Principal do Electron
│   │   ├── main.js           # Inicialização da janela, menus nativos e IPC
│   │   ├── file-watcher.js   # Monitoramento em tempo real com Chokidar
│   │   └── store.js          # Persistência de configurações e histórico
│   ├── preload/              # Camada Preload segura
│   │   ├── preload.js        # API exposta via ContextBridge
│   │   └── markdown-engine.js# Motor de renderização GFM, KaTeX e Highlight.js
│   └── renderer/             # Interface Desktop do Electron
│       ├── index.html        # Estrutura HTML da janela principal
│       ├── css/
│       │   ├── app.css       # Layout da aplicação, abas e barra de formatação
│       │   ├── markdown.css  # Estilização tipográfica do Markdown renderizado
│       │   └── themes.css    # 7 temas visuais customizáveis
│       └── js/
│           └── app.js        # Lógica de abas, editor interativo, TOC e atalhos
└── dist/                     # Diretório de distribuição gerado nos builds
    ├── desktop/              # Instaladores .exe e pacotes desktop (ignorado no git)
    ├── extension/            # Extensão descompactada pronta para o Chrome
    └── mdviewer-chrome-extension.zip # Pacote ZIP para distribuição da extensão
```

---

## 🛠️ Tecnologias Utilizadas

- **[Electron](https://www.electronjs.org/)**: Framework desktop multiplataforma.
- **[Marked](https://marked.js.org/)**: Parser e compilador Markdown de alta velocidade.
- **[Highlight.js](https://highlightjs.org/)**: Realce de sintaxe com suporte a dezenas de linguagens.
- **[KaTeX](https://katex.org/)**: Renderização rápida de expressões matemáticas TeX.
- **[Mermaid.js](https://mermaid.js.org/)**: Geração de diagramas e gráficos baseados em texto.
- **[Chokidar](https://github.com/paulmillr/chokidar)**: Monitoramento eficiente de arquivos do sistema operacional.

---

## 📄 Licença

Distribuído sob a licença **MIT**.
