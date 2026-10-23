const { app, dialog, Menu } = require('electron');

function getWindow(getMainWindow) {
  if (typeof getMainWindow === 'function') {
    return getMainWindow();
  }
  return getMainWindow || null;
}

function createFileMenu(isMac, getMainWindow) {
  return {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Novo Arquivo',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:new-file');
        }
      },
      {
        label: 'Abrir Arquivo...',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:open-file');
        }
      },
      {
        label: 'Abrir Pasta...',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:open-folder');
        }
      },
      { type: 'separator' },
      {
        label: 'Salvar',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:save-file');
        }
      },
      {
        label: 'Salvar Como...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:save-file-as');
        }
      },
      { type: 'separator' },
      {
        label: 'Fechar Aba',
        accelerator: 'CmdOrCtrl+W',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:close-tab');
        }
      },
      {
        label: 'Recarregar Arquivo',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:reload-file');
        }
      },
      { type: 'separator' },
      {
        label: 'Exportar para HTML...',
        accelerator: 'CmdOrCtrl+Shift+E',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:export-html');
        }
      },
      {
        label: 'Imprimir / Exportar PDF...',
        accelerator: 'CmdOrCtrl+P',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:export-pdf');
        }
      },
      { type: 'separator' },
      {
        label: 'Sair',
        accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => app.quit()
      }
    ]
  };
}

function createEditMenu(isMac, getMainWindow) {
  return {
    label: 'Editar',
    submenu: [
      { role: 'undo', label: 'Desfazer', accelerator: 'CmdOrCtrl+Z' },
      { role: 'redo', label: 'Refazer', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y' },
      { type: 'separator' },
      { role: 'cut', label: 'Recortar' },
      { role: 'copy', label: 'Copiar' },
      { role: 'paste', label: 'Colar' },
      { type: 'separator' },
      {
        label: 'Localizar no Documento',
        accelerator: 'CmdOrCtrl+F',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:find');
        }
      },
      { type: 'separator' },
      { role: 'selectAll', label: 'Selecionar Tudo' }
    ]
  };
}

function createViewMenu(getMainWindow) {
  return {
    label: 'Visualizar',
    submenu: [
      {
        label: 'Alternar Barra Lateral',
        accelerator: 'CmdOrCtrl+B',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:toggle-sidebar');
        }
      },
      {
        label: 'Alternar Índice (TOC)',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:toggle-toc');
        }
      },
      { type: 'separator' },
      {
        label: 'Modo Pré-visualização',
        accelerator: 'Alt+1',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:set-view-mode', 'preview');
        }
      },
      {
        label: 'Modo Dividido (Split)',
        accelerator: 'Alt+2',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:set-view-mode', 'split');
        }
      },
      {
        label: 'Modo Código Fonte',
        accelerator: 'Alt+3',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:set-view-mode', 'source');
        }
      },
      { type: 'separator' },
      {
        label: 'Aumentar Zoom',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:zoom-in');
        }
      },
      {
        label: 'Diminuir Zoom',
        accelerator: 'CmdOrCtrl+-',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:zoom-out');
        }
      },
      {
        label: 'Restaurar Zoom',
        accelerator: 'CmdOrCtrl+0',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:zoom-reset');
        }
      },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Tela Cheia' },
      { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' }
    ]
  };
}

function createHelpMenu(getMainWindow) {
  return {
    label: 'Ajuda',
    submenu: [
      {
        label: 'Abrir Documento de Exemplo',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:open-sample');
        }
      },
      {
        label: 'Atalhos de Teclado',
        accelerator: 'F1',
        click: () => {
          const win = getWindow(getMainWindow);
          if (win && !win.isDestroyed()) win.webContents.send('menu:show-shortcuts');
        }
      },
      { type: 'separator' },
      {
        label: 'Sobre o MDViewer',
        click: () => {
          const win = getWindow(getMainWindow);
          dialog.showMessageBox(win, {
            type: 'info',
            title: 'Sobre o MDViewer',
            message: 'MDViewer Desktop',
            detail: `Versão 1.0.0\nLeitor e Visualizador de Markdown para Windows e Linux\n\nRecursos:\n• Suporte completo a GFM, Tabelas e Checklists\n• Realce de Sintaxe (Highlight.js)\n• Diagramas Mermaid interativos\n• Fórmulas Matemáticas LaTeX (KaTeX)\n• Callouts e Alertas GitHub\n• Live Reload com Chokidar\n• Exportação para PDF e HTML`
          });
        }
      }
    ]
  };
}

function createAppMenu(getMainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    createFileMenu(isMac, getMainWindow),
    createEditMenu(isMac, getMainWindow),
    createViewMenu(getMainWindow),
    createHelpMenu(getMainWindow)
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = {
  createAppMenu,
  createFileMenu,
  createEditMenu,
  createViewMenu,
  createHelpMenu
};
