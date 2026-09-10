# 🚀 Bem-vindo ao MDViewer Desktop

O **MDViewer** é um aplicativo desktop rápido, moderno e completo para leitura e visualização de documentos **Markdown** no seu ambiente Linux.

---

## 📑 Recursos Principais

- ⚡ **GitHub Flavored Markdown (GFM)** nativo (Tabelas, Listas de Tarefas, Links e Imagens)
- 🎨 **7 Temas Visuais** (GitHub Dark, GitHub Light, Dracula, Nord, One Dark, Sépia, Monokai)
- 📊 **Diagramas Mermaid Interativos** renderizados em tempo real
- 🧮 **Fórmulas Matemáticas LaTeX** com KaTeX ($E = mc^2$)
- 💡 **Alertas e Callouts GitHub** (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, etc.)
- 💻 **Realce de Sintaxe** com mais de 100 linguagens e botão de cópia rápida
- 🔄 **Live Sync / Auto-Reload**: detecção instantânea de alterações no disco via Chokidar
- 📑 **Múltiplas Abas** e **Explorador de Arquivos / Índice (TOC)** lateral
- 🔍 **Localizador no Documento** (Ctrl+F) com navegação rápida
- 🖨️ **Exportação** para PDF e HTML autocontido

---

## 💡 GitHub Callouts / Alertas

> [!NOTE]
> Este é um alerta informativo de **Nota**. Útil para contextualizar observações no documento.

> [!TIP]
> **Dica**: Use o atalho `Ctrl + B` para alternar a barra lateral e `Ctrl + F` para buscar qualquer texto!

> [!IMPORTANT]
> O MDViewer monitora automaticamente o arquivo aberto. Qualquer alteração feita por outros editores (como Vim, Nano, VS Code) é atualizada imediatamente sem perder a posição de rolagem.

> [!WARNING]
> Certifique-se de salvar seus arquivos com codificação UTF-8 para compatibilidade perfeita com caracteres especiais e emojis.

> [!CAUTION]
> Ao exportar para PDF, verifique se a pré-visualização está ajustada ao zoom desejado.

---

## 📊 Diagramas Mermaid

O MDViewer suporta diagramas Mermaid diretamente nos blocos de código.

### Fluxograma de Arquitetura

```mermaid
graph TD
    A[Arquivo .md no Disco] -->|Chokidar Watcher| B(MDViewer Core)
    B -->|Marked Parser| C[Renderizador GFM]
    B -->|Highlight.js| D[Realce de Código]
    B -->|KaTeX| E[Fórmulas Matemáticas]
    B -->|Mermaid.js| F[Diagramas SVG]
    C --> G[Interface Desktop Linux]
    D --> G
    E --> G
    F --> G
```

### Diagrama de Sequência

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário
    participant App as MDViewer Desktop
    participant Watcher as Chokidar Watcher
    participant File as Arquivo no Disco

    Usuario->>App: Abre arquivo Markdown (Ctrl+O)
    App->>File: Lê conteúdo UTF-8
    App->>Watcher: Inicia monitoramento
    App-->>Usuario: Renderiza documento com TOC
    File->>Watcher: Evento de alteração no disco
    Watcher->>App: Notifica alteração
    App-->>Usuario: Atualização instantânea (Live Reload)
```

---

## 🧮 Fórmulas Matemáticas (KaTeX)

O MDViewer suporta fórmulas matemáticas em linha como $f(x) = ax^2 + bx + c$ ou a Identidade de Euler $e^{i\pi} + 1 = 0$.

Também suporta blocos matemáticos destacados com `$$ ... $$`:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

Equação de Schrödinger dependente do tempo:

$$
i\hbar \frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left[ -\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r},t)\right]\Psi(\mathbf{r},t)
$$

---

## 💻 Realce de Código e Sintaxe

### Python

```python
import os
from pathlib import Path

def listar_arquivos_markdown(diretorio: str) -> list[Path]:
    """Retorna todos os arquivos .md encontrados na pasta."""
    caminho = Path(diretorio)
    return sorted(caminho.glob("**/*.md"))

if __name__ == "__main__":
    pasta = os.path.expanduser("~/Documentos")
    arquivos = listar_arquivos_markdown(pasta)
    print(f"Encontrados {len(arquivos)} arquivos Markdown.")
```

### JavaScript / Node.js

```javascript
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

### Rust

```rust
fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    let termos: Vec<u64> = (0..10).map(fibonacci).collect();
    println!("Fibonacci: {:?}", termos);
}
```

---

## 📋 Tabelas e Listas de Tarefas

### Tabela de Comparação de Recursos

| Recurso | MDViewer | Outros Leitores |
| :--- | :---: | :---: |
| **Diagramas Mermaid** | ✅ Sim | ❌ Raro |
| **Fórmulas KaTeX** | ✅ Sim | ⚠️ Básico |
| **Live Sync / Auto-Reload** | ✅ Sim | ❌ Não |
| **Exportação PDF / HTML** | ✅ Sim | ⚠️ Parcial |
| **Explorador & TOC Integrados** | ✅ Sim | ⚠️ Limitado |
| **Múltiplos Temas** | ✅ 7 Temas | ❌ 1 ou 2 |

### Checklist de Tarefas

- [x] Desenvolver o núcleo do visualizador com Electron
- [x] Implementar motor de renderização GFM completo
- [x] Adicionar suporte a fórmulas KaTeX e diagramas Mermaid
- [x] Integrar monitor de arquivos Chokidar para live-reload
- [x] Criar exportador para PDF e HTML autônomo
- [x] Configurar atalhos de teclado e integração desktop Linux
- [ ] Explorar seus próprios arquivos `.md`!

---

## ⌨️ Principais Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| `Ctrl + O` | Abrir Arquivo |
| `Ctrl + Shift + O` | Abrir Pasta no Explorador |
| `Ctrl + W` | Fechar Aba Atual |
| `Ctrl + R` | Recarregar Arquivo |
| `Ctrl + F` | Localizar Texto no Documento |
| `Ctrl + P` | Imprimir / Exportar para PDF |
| `Ctrl + B` | Alternar Barra Lateral |
| `Alt + 1` | Modo Visualização (Preview) |
| `Alt + 2` | Modo Dividido (Split) |
| `Alt + 3` | Modo Código Fonte |
| `Ctrl + + / - / 0` | Aumentar / Diminuir / Resetar Zoom |
| `F1` | Painel de Atalhos |
| `F11` | Tela Cheia |

---

*Aproveite a experiência com o MDViewer no seu Linux!*
