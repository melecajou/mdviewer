# 📖 MDViewer Desktop (Linux)

> **MDViewer** é um leitor e visualizador desktop moderno, rápido e elegante de arquivos Markdown, projetado especificamente para estações de trabalho Linux.

![MDViewer Icon](src/assets/icon.svg)

---

## ✨ Recursos

- ⚡ **Renderização Completa GitHub Flavored Markdown (GFM)**:
  - Tabelas formatadas e responsivas
  - Listas de tarefas interativas (*task lists* com checkboxes)
  - Links externos e navegação entre arquivos `.md` locais
  - Quebras de linha e tipografia refinada
- 🎨 **7 Temas Visuais Modernos**:
  - `GitHub Dark` (padrão escuro)
  - `GitHub Light` (modo claro)
  - `Dracula`
  - `Nord`
  - `One Dark`
  - `Sépia` (ideal para longas leituras)
  - `Monokai`
- 📊 **Diagramas Mermaid Interativos**:
  - Suporte a fluxogramas (`graph TD`), diagramas de sequência (`sequenceDiagram`), grafos Git, diagramas de classes e estados renderizados diretamente no documento.
- 🧮 **Fórmulas Matemáticas LaTeX (KaTeX)**:
  - Fórmulas em linha (`$E = mc^2$`) e blocos destacados (`$$\int_0^\infty ...$$`).
- 💡 **Alertas e Callouts GitHub**:
  - Suporte visual completo para `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]` e `> [!CAUTION]`.
- 💻 **Realce de Sintaxe Avançado (Highlight.js)**:
  - Suporte a mais de 100 linguagens de programação.
  - Numeração de linhas e botão de **Copiar Código** com 1 clique.
- 🔄 **Live Sync & Auto-Reload em Tempo Real**:
  - Monitoramento inteligente via **Chokidar**. Se o arquivo for editado em outro programa (Vim, VS Code, Nano, etc.), o MDViewer atualiza a exibição instantaneamente sem perder a posição de rolagem.
- 📑 **Interface com Múltiplas Abas**:
  - Abra múltiplos arquivos ao mesmo tempo em abas independentes.
- 📂 **Barra Lateral com 3 Modos**:
  - **Explorador de Arquivos**: navegue por pastas e filtre arquivos Markdown.
  - **Sumário / TOC (Table of Contents)**: índice interativo de seções (H1-H6) que acompanha a rolagem.
  - **Arquivos Recentes**: acesse rapidamente documentos abertos recentemente.
- 🔀 **3 Modos de Visualização**:
  - **Visualização Renderizada** (Preview)
  - **Modo Dividido** (Split View - Código fonte à esquerda com rolagem sincronizada e pré-visualização à direita)
  - **Modo Código Fonte** (Source)
- 🔍 **Localizador no Documento (Ctrl+F)**:
  - Busca em tempo real com realce de termos, contagem de ocorrências e navegação Próximo/Anterior.
- 🖨️ **Exportação Profissional**:
  - **Exportar como PDF** (via diálogo de impressão nativo)
  - **Exportar como HTML** (arquivo HTML autônomo completo com estilos embutidos)
- 🖼️ **Lightbox para Imagens**:
  - Clique em qualquer imagem no Markdown para expandir em tela cheia com alta resolução.

---

## 🚀 Como Executar

### 1. Via linha de comando (CLI)

No diretório do projeto:

```bash
# Iniciar a aplicação
npm start

# Ou abrir um arquivo específico diretamente
./bin/mdviewer sample.md

# Ou abrir uma pasta no explorador
./bin/mdviewer /caminho/da/sua/pasta
```

### 2. Executar de qualquer lugar do terminal

O script de instalação já configurou o atalho global em `~/.local/bin/mdviewer`. Você pode simplesmente digitar:

```bash
mdviewer meuarquivo.md
```

### 3. Pelo Menu de Aplicativos do Linux

O MDViewer foi registrado no seu ambiente desktop (GNOME, KDE, XFCE, etc.). Basta pressionar a tecla `Super` (Windows) e pesquisar por **MDViewer**.

### 4. Como Extensão para o Google Chrome (Manifest V3)

Você também pode utilizar o MDViewer diretamente dentro do Google Chrome ou navegadores baseados em Chromium (Brave, Edge, etc.):

1. **Construir a extensão**:
   ```bash
   npm run build:extension
   ```
2. **Carregar no Chrome**:
   - Abra o navegador e acesse `chrome://extensions`
   - Ative a chave **"Modo do desenvolvedor"** no canto superior direito
   - Clique no botão **"Carregar sem compactação"**
   - Selecione a pasta `dist/extension/` gerada no projeto
3. **Visualizar arquivos locais (`file:///`)**:
   - Na página da extensão em `chrome://extensions`, clique em **"Detalhes"**
   - Ative a opção **"Permitir acesso aos URLs do arquivo"**
   - Agora qualquer arquivo `.md` aberto no Chrome ou arrastado para o navegador será renderizado instantaneamente!

### 5. Versão Desktop para Windows 11

O MDViewer possui suporte nativo e empacotamento completo para o Windows 11:

1. **Compilar os instaladores do Windows**:
   ```bash
   # Gera o instalador .exe (NSIS) e a versão portátil em dist/desktop/
   npm run build:win
   ```
2. **Arquivos gerados em `dist/desktop/`**:
   - `MDViewer Setup 1.0.0.exe`: Instalador completo padrão Windows com criação de atalhos e associação automática dos arquivos `.md` e `.markdown`.
   - `MDViewer 1.0.0.exe`: Versão portátil independente (*Portable*), ideal para pendrives ou execução sem instalação.
3. **Execução via linha de comando no Windows**:
   - Via CMD: `bin\mdviewer.cmd meuarquivo.md`
   - Via PowerShell: `.\bin\mdviewer.ps1 meuarquivo.md`

---

## ⌨️ Atalhos de Teclado

| Atalho | Descrição |
| :--- | :--- |
| `Ctrl + O` | Abrir Arquivo Markdown |
| `Ctrl + Shift + O` | Abrir Pasta no Explorador Lateral |
| `Ctrl + W` | Fechar Aba Atual |
| `Ctrl + R` | Recarregar Arquivo |
| `Ctrl + F` | Buscar / Localizar no Documento |
| `Ctrl + P` | Imprimir / Exportar para PDF |
| `Ctrl + Shift + E`| Exportar como HTML |
| `Ctrl + B` | Alternar Exibição da Barra Lateral |
| `Ctrl + Shift + T`| Alternar para o Índice (TOC) |
| `Alt + 1` | Modo Pré-visualização |
| `Alt + 2` | Modo Dividido (Split) |
| `Alt + 3` | Modo Código Fonte |
| `Ctrl + +` | Aumentar Zoom |
| `Ctrl + -` | Diminuir Zoom |
| `Ctrl + 0` | Restaurar Zoom (100%) |
| `F1` | Janela de Atalhos de Teclado |
| `F11` | Alternar Modo Tela Cheia |

---

## 📁 Estrutura do Projeto

```
mdviewer/
├── bin/
│   └── mdviewer              # Script executável de inicialização CLI
├── src/
│   ├── assets/
│   │   ├── icon.svg          # Ícone vetorial do MDViewer
│   │   └── icon.png          # Ícone PNG 512x512 para o sistema Linux
│   ├── main/
│   │   ├── main.js           # Processo Principal do Electron, Menus e IPC
│   │   ├── file-watcher.js   # Monitoramento em tempo real com Chokidar
│   │   └── store.js          # Persistência de configurações e histórico
│   ├── preload/
│   │   ├── preload.js        # Ponte segura ContextBridge
│   │   └── markdown-engine.js# Motor de renderização GFM, KaTeX e Highlight.js
│   └── renderer/
│       ├── index.html        # Interface de usuário principal
│       ├── css/
│       │   ├── app.css       # Layout da aplicação e componentes
│       │   ├── markdown.css  # Estilização tipográfica do Markdown
│       │   └── themes.css    # 7 temas visuais customizáveis
│       └── js/
│           └── app.js        # Lógica de interface, abas, TOC e busca
├── mdviewer.desktop          # Entrada de aplicativo para o desktop Linux
├── install.sh                # Script de instalação e integração no sistema
├── sample.md                 # Documento de demonstração de todos os recursos
└── package.json              # Dependências e metadados
```

---

## 📄 Licença

Distribuído sob a licença MIT.
