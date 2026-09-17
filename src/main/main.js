const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('./store');
const FileWatcherManager = require('./file-watcher');

app.setName('MDViewer');
if (process.platform === 'linux' && typeof app.setDesktopName === 'function') {
  app.setDesktopName('mdviewer.desktop');
}

let mainWindow = null;
const store = new Store();
let watcherManager = null;

const allowedPaths = new Set();

function addAllowedPath(p) {
  if (!p || typeof p !== 'string') return;
  try {
    allowedPaths.add(path.resolve(p));
  } catch (e) {
    console.error('Error resolving path to allow:', e);
  }
}

function isPathAllowed(p) {
  if (!p || typeof p !== 'string') return false;
  try {
    const target = path.resolve(p);
    for (const allowed of allowedPaths) {
      if (target === allowed) return true;
      const rel = path.relative(allowed, target);
      if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
        return true;
      }
    }
  } catch (e) {
    console.error('Error validating path:', e);
  }
  return false;
}


// Parse file/folder paths from command line arguments
function parseCommandLineArgs(argv, cwd = process.cwd()) {
  const targets = [];
  if (!Array.isArray(argv)) return targets;

  const appPath = path.resolve(__dirname, '../..');
  const mainScriptPath = path.resolve(__dirname, 'main.js');

  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (!arg || typeof arg !== 'string') continue;

    // Skip flags (e.g. --ozone-platform, -r, etc.)
    if (arg.startsWith('-')) continue;

    // Skip electron or mdviewer binaries (Linux & Windows)
    if (
      arg.endsWith('/electron') ||
      arg.endsWith('\\electron.exe') ||
      arg.endsWith('/electron.exe') ||
      arg.endsWith('\\mdviewer.exe') ||
      arg.endsWith('/mdviewer.exe') ||
      arg === 'electron' ||
      arg === 'mdviewer'
    ) {
      continue;
    }

    // Handle file:// URIs (from file managers / freedesktop / Windows shell)
    if (arg.startsWith('file://')) {
      try {
        const parsedUrl = new URL(arg);
        arg = decodeURIComponent(parsedUrl.pathname);
        if (process.platform === 'win32') {
          arg = arg.replace(/^\/([a-zA-Z]:)/, '$1');
        }
      } catch {
        arg = arg.replace(/^file:\/\//, '');
      }
    }

    try {
      const resolved = path.isAbsolute(arg) ? path.resolve(arg) : path.resolve(cwd, arg);

      // Skip the app directory and main script
      if (resolved === appPath || resolved === mainScriptPath) {
        continue;
      }

      // Check if target exists on disk
      if (fs.existsSync(resolved)) {
        targets.push(resolved);
        addAllowedPath(resolved);
      }
    } catch (e) {
      console.error('Error checking arg path:', e);
    }
  }
  return targets;
}

let pendingTargets = parseCommandLineArgs(process.argv);

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const targets = parseCommandLineArgs(commandLine, workingDirectory);
    targets.forEach(t => addAllowedPath(t));
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      if (targets.length > 0) {
        mainWindow.webContents.send('cli:open-targets', targets);
      }
    } else {
      pendingTargets.push(...targets);
    }
  });

  app.whenReady().then(async () => {
    await store.init();

    // Initialize Allowed Paths from store and other known locations
    const allSettings = store.getAll();
    if (allSettings.recentFiles) {
      allSettings.recentFiles.forEach(f => addAllowedPath(f));
    }
    if (allSettings.recentFolders) {
      allSettings.recentFolders.forEach(f => addAllowedPath(f));
    }
    if (allSettings.lastOpenedFolder) {
      addAllowedPath(allSettings.lastOpenedFolder);
    }
    if (allSettings.lastDirectory) {
      addAllowedPath(allSettings.lastDirectory);
    }
    addAllowedPath(path.join(__dirname, '../../sample.md'));
    pendingTargets.forEach(t => addAllowedPath(t));

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

function createWindow() {
  const savedBounds = store.get('windowBounds') || {};
  const isWin = process.platform === 'win32';
  const icoPath = path.join(__dirname, '../assets/icon.ico');
  const pngPath = path.join(__dirname, '../assets/icon.png');
  const iconImg = fs.existsSync(pngPath) ? nativeImage.createFromPath(pngPath) : undefined;
  const iconPath = (isWin && fs.existsSync(icoPath)) ? icoPath : (iconImg || pngPath);

  mainWindow = new BrowserWindow({
    width: savedBounds.width || 1200,
    height: savedBounds.height || 800,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 750,
    minHeight: 500,
    title: 'MDViewer',
    icon: iconPath,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (iconImg && process.platform === 'linux') {
    mainWindow.setIcon(iconImg);
  }

  // Init watcher
  watcherManager = new FileWatcherManager((event, filePath) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('file:changed', { event, filePath });
    }
  });

  // Save window bounds on resize/move
  const saveBounds = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  // Build native menu
  createAppMenu();

  // Load index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // When DOM is ready, send initial command-line targets if any
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingTargets.length > 0) {
      mainWindow.webContents.send('cli:open-targets', [...pendingTargets]);
    }
  });

  mainWindow.on('closed', () => {
    if (watcherManager) {
      watcherManager.clear();
    }
    mainWindow = null;
  });
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Arquivo',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow && mainWindow.webContents.send('menu:new-file')
        },
        {
          label: 'Abrir Arquivo...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow && mainWindow.webContents.send('menu:open-file')
        },
        {
          label: 'Abrir Pasta...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow && mainWindow.webContents.send('menu:open-folder')
        },
        { type: 'separator' },
        {
          label: 'Salvar',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow && mainWindow.webContents.send('menu:save-file')
        },
        {
          label: 'Salvar Como...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow && mainWindow.webContents.send('menu:save-file-as')
        },
        { type: 'separator' },
        {
          label: 'Fechar Aba',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow && mainWindow.webContents.send('menu:close-tab')
        },
        {
          label: 'Recarregar Arquivo',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.webContents.send('menu:reload-file')
        },
        { type: 'separator' },
        {
          label: 'Exportar para HTML...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow && mainWindow.webContents.send('menu:export-html')
        },
        {
          label: 'Imprimir / Exportar PDF...',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow && mainWindow.webContents.send('menu:export-pdf')
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
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
          click: () => mainWindow && mainWindow.webContents.send('menu:find')
        },
        { type: 'separator' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        {
          label: 'Alternar Barra Lateral',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow && mainWindow.webContents.send('menu:toggle-sidebar')
        },
        {
          label: 'Alternar Índice (TOC)',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => mainWindow && mainWindow.webContents.send('menu:toggle-toc')
        },
        { type: 'separator' },
        {
          label: 'Modo Pré-visualização',
          accelerator: 'Alt+1',
          click: () => mainWindow && mainWindow.webContents.send('menu:set-view-mode', 'preview')
        },
        {
          label: 'Modo Dividido (Split)',
          accelerator: 'Alt+2',
          click: () => mainWindow && mainWindow.webContents.send('menu:set-view-mode', 'split')
        },
        {
          label: 'Modo Código Fonte',
          accelerator: 'Alt+3',
          click: () => mainWindow && mainWindow.webContents.send('menu:set-view-mode', 'source')
        },
        { type: 'separator' },
        {
          label: 'Aumentar Zoom',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow && mainWindow.webContents.send('menu:zoom-in')
        },
        {
          label: 'Diminuir Zoom',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow && mainWindow.webContents.send('menu:zoom-out')
        },
        {
          label: 'Restaurar Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow && mainWindow.webContents.send('menu:zoom-reset')
        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
        { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Abrir Documento de Exemplo',
          click: () => mainWindow && mainWindow.webContents.send('menu:open-sample')
        },
        {
          label: 'Atalhos de Teclado',
          accelerator: 'F1',
          click: () => mainWindow && mainWindow.webContents.send('menu:show-shortcuts')
        },
        { type: 'separator' },
        {
          label: 'Sobre o MDViewer',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o MDViewer',
              message: 'MDViewer Desktop',
              detail: `Versão 1.0.0\nLeitor e Visualizador de Markdown para Windows e Linux\n\nRecursos:\n• Suporte completo a GFM, Tabelas e Checklists\n• Realce de Sintaxe (Highlight.js)\n• Diagramas Mermaid interativos\n• Fórmulas Matemáticas LaTeX (KaTeX)\n• Callouts e Alertas GitHub\n• Live Reload com Chokidar\n• Exportação para PDF e HTML`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ---------------- IPC Handlers ----------------

// Dialog: Open File
ipcMain.handle('dialog:open-file', async (event, preferredPath) => {
  const defaultPath = await store.getLastDirectory(preferredPath);
  const options = {
    title: 'Abrir Arquivo Markdown',
    properties: ['openFile'],
    filters: [
      { name: 'Arquivos Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx', 'txt'] },
      { name: 'Todos os Arquivos', extensions: ['*'] }
    ]
  };
  if (defaultPath) {
    options.defaultPath = defaultPath;
  }
  const result = await dialog.showOpenDialog(mainWindow, options);
  if (!result.canceled && result.filePaths.length > 0) {
    const selected = result.filePaths[0];
    addAllowedPath(selected);
    addAllowedPath(path.dirname(selected));
    store.setLastDirectory(path.dirname(selected));
    return selected;
  }
  return null;
});

// Dialog: Open Folder
ipcMain.handle('dialog:open-folder', async (event, preferredPath) => {
  const defaultPath = await store.getLastDirectory(preferredPath);
  const options = {
    title: 'Abrir Pasta no Explorador',
    properties: ['openDirectory']
  };
  if (defaultPath) {
    options.defaultPath = defaultPath;
  }
  const result = await dialog.showOpenDialog(mainWindow, options);
  if (!result.canceled && result.filePaths.length > 0) {
    const selected = result.filePaths[0];
    addAllowedPath(selected);
    store.setLastDirectory(selected);
    store.set('lastOpenedFolder', selected);
    return selected;
  }
  return null;
});

// File: Read Content
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    if (!isPathAllowed(filePath)) {
      return {
        success: false,
        error: 'Access denied: Path is not allowed.',
        filePath
      };
    }
    const resolvedPath = path.resolve(filePath);
    const content = await fs.promises.readFile(resolvedPath, 'utf-8');
    const stats = await fs.promises.stat(resolvedPath);
    store.addRecentFile(resolvedPath);
    store.setLastDirectory(path.dirname(resolvedPath));
    return {
      success: true,
      filePath: resolvedPath,
      fileName: path.basename(resolvedPath),
      dirName: path.dirname(resolvedPath),
      content,
      size: stats.size,
      mtime: stats.mtimeMs
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      filePath
    };
  }
});

// File: Save Content (Overwrites existing file)
ipcMain.handle('file:save', async (event, { filePath, content }) => {
  try {
    if (!filePath) {
      return { success: false, error: 'Caminho do arquivo não fornecido.' };
    }
    if (!isPathAllowed(filePath)) {
      return { success: false, error: 'Access denied: Path is not allowed.' };
    }
    const resolvedPath = path.resolve(filePath);
    if (watcherManager) {
      watcherManager.ignoreNext(resolvedPath);
    }
    await fs.promises.writeFile(resolvedPath, content, 'utf-8');
    const stats = await fs.promises.stat(resolvedPath);
    store.addRecentFile(resolvedPath);
    return {
      success: true,
      filePath: resolvedPath,
      fileName: path.basename(resolvedPath),
      dirName: path.dirname(resolvedPath),
      size: stats.size,
      mtime: stats.mtimeMs
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

// File: Save As Dialog
ipcMain.handle('file:save-as', async (event, { content, defaultName, defaultDir }) => {
  try {
    const dir = await store.getLastDirectory(defaultDir);
    const defaultPath = dir ? path.join(dir, defaultName || 'documento.md') : (defaultName || 'documento.md');
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Salvar Arquivo Como',
      defaultPath,
      filters: [
        { name: 'Arquivos Markdown (*.md)', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
        { name: 'Todos os Arquivos', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      const resolvedPath = path.resolve(result.filePath);
      addAllowedPath(resolvedPath);
      if (watcherManager) {
        watcherManager.ignoreNext(resolvedPath);
        watcherManager.watch(resolvedPath);
      }
      await fs.promises.writeFile(resolvedPath, content, 'utf-8');
      const stats = await fs.promises.stat(resolvedPath);
      store.addRecentFile(resolvedPath);
      store.setLastDirectory(path.dirname(resolvedPath));
      return {
        success: true,
        filePath: resolvedPath,
        fileName: path.basename(resolvedPath),
        dirName: path.dirname(resolvedPath),
        size: stats.size,
        mtime: stats.mtimeMs
      };
    }
    return { canceled: true };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

// Dialog: Confirm Unsaved Changes
ipcMain.handle('dialog:confirm-unsaved', async (event, fileName) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Salvar', 'Não Salvar', 'Cancelar'],
    defaultId: 0,
    cancelId: 2,
    title: 'Alterações não salvas',
    message: `Deseja salvar as alterações feitas em "${fileName || 'documento'}" antes de continuar?`,
    detail: 'Suas alterações serão perdidas se você não as salvar.'
  });

  // 0: Salvar, 1: Não Salvar, 2: Cancelar
  return result.response;
});

// File: Read Directory Tree
ipcMain.handle('file:read-dir', async (event, dirPath) => {
  try {
    if (!isPathAllowed(dirPath)) {
      return { success: false, error: 'Access denied: Path is not allowed.' };
    }
    const resolvedDir = path.resolve(dirPath);
    store.addRecentFolder(resolvedDir);
    store.set('lastOpenedFolder', resolvedDir);
    store.setLastDirectory(resolvedDir);

    async function scanDirectory(dir, depth = 0) {
      if (depth > 5) return []; // Limit recursion depth
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      const promises = entries.map(async (entry) => {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__' || entry.name === 'target' || entry.name === 'dist') {
          return null;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const children = await scanDirectory(fullPath, depth + 1);
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: true,
            children
          };
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          const isMd = ['.md', '.markdown', '.mdown', '.mkd', '.mdx', '.txt'].includes(ext);
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: false,
            extension: ext,
            isMarkdown: isMd
          };
        }
      });

      const items = (await Promise.all(promises)).filter(Boolean);

      // Sort: folders first, then markdown files, then others
      return items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        if (a.isMarkdown && !b.isMarkdown) return -1;
        if (!a.isMarkdown && b.isMarkdown) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    const tree = await scanDirectory(resolvedDir);
    return {
      success: true,
      dirPath: resolvedDir,
      dirName: path.basename(resolvedDir),
      tree
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// File: Watch / Unwatch
ipcMain.handle('file:watch', (event, filePath) => {
  if (watcherManager && isPathAllowed(filePath)) {
    watcherManager.watch(filePath);
  }
  return true;
});

ipcMain.handle('file:unwatch', (event, filePath) => {
  if (watcherManager) {
    watcherManager.unwatch(filePath);
  }
  return true;
});

// Export: Save HTML
ipcMain.handle('export:html', async (event, { defaultName, htmlContent, defaultDir }) => {
  const dir = await store.getLastDirectory(defaultDir);
  const defaultPath = dir ? path.join(dir, defaultName || 'documento.html') : (defaultName || 'documento.html');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar como HTML',
    defaultPath,
    filters: [{ name: 'Arquivo HTML', extensions: ['html', 'htm'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      await fs.promises.writeFile(result.filePath, htmlContent, 'utf-8');
      store.setLastDirectory(path.dirname(result.filePath));
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { canceled: true };
});

// Export: Save PDF
ipcMain.handle('export:pdf', async (event, { defaultName, defaultDir }) => {
  const dir = await store.getLastDirectory(defaultDir);
  const defaultPath = dir ? path.join(dir, defaultName || 'documento.pdf') : (defaultName || 'documento.pdf');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar como PDF',
    defaultPath,
    filters: [{ name: 'Documento PDF', extensions: ['pdf'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      const data = await mainWindow.webContents.printToPDF({
        margins: {
          marginType: 'custom',
          top: 1,
          bottom: 1,
          left: 1,
          right: 1
        },
        printBackground: true,
        pageSize: 'A4'
      });
      await fs.promises.writeFile(result.filePath, data);
      store.setLastDirectory(path.dirname(result.filePath));
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { canceled: true };
});

// Settings & Store IPC
ipcMain.handle('store:get-all', () => store.getAll());
ipcMain.handle('store:set-all', (event, settings) => {
  store.setAll(settings);
  return true;
});
ipcMain.handle('store:remove-recent-file', (event, filePath) => {
  store.removeRecentFile(filePath);
  return store.getAll();
});

// Shell & Utilities
ipcMain.handle('shell:open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
    shell.openExternal(url);
  }
  return true;
});

ipcMain.handle('shell:show-in-folder', (event, filePath) => {
  if (filePath && fs.existsSync(filePath) && isPathAllowed(filePath)) {
    shell.showItemInFolder(filePath);
  } else {
    console.warn('Attempted to show restricted path or path does not exist:', filePath);
  }
  return true;
});

// Get Sample Document Path
ipcMain.handle('app:get-sample-path', () => {
  return path.join(__dirname, '../../sample.md');
});

// Initial CLI Targets
ipcMain.handle('app:get-initial-targets', () => {
  const targets = [...pendingTargets];
  pendingTargets = [];
  return targets;
});

// Allow user dropped path
ipcMain.handle('app:allow-dropped-path', (event, targetPath) => {
  if (targetPath && typeof targetPath === 'string' && fs.existsSync(targetPath)) {
    addAllowedPath(targetPath);
    addAllowedPath(path.dirname(targetPath));
    return true;
  }
  return false;
});

// App Quit
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
