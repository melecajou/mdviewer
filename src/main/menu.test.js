const { app, dialog, Menu } = require('electron');
const {
  createAppMenu,
  createFileMenu,
  createEditMenu,
  createViewMenu,
  createHelpMenu
} = require('./menu');

jest.mock('electron', () => ({
  app: {
    quit: jest.fn()
  },
  dialog: {
    showMessageBox: jest.fn()
  },
  Menu: {
    buildFromTemplate: jest.fn((template) => template),
    setApplicationMenu: jest.fn()
  }
}));

describe('menu module', () => {
  let mockWindow;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow = {
      isDestroyed: jest.fn().mockReturnValue(false),
      webContents: {
        send: jest.fn()
      }
    };
  });

  describe('createFileMenu', () => {
    it('should configure File menu items correctly on non-Mac', () => {
      const menu = createFileMenu(false, () => mockWindow);
      expect(menu.label).toBe('Arquivo');

      const quitItem = menu.submenu.find(item => item.label === 'Sair');
      expect(quitItem.accelerator).toBe('Ctrl+Q');
    });

    it('should configure Quit accelerator as Cmd+Q on Mac', () => {
      const menu = createFileMenu(true, () => mockWindow);
      const quitItem = menu.submenu.find(item => item.label === 'Sair');
      expect(quitItem.accelerator).toBe('Cmd+Q');
    });

    it('should send expected IPC messages when menu items are clicked', () => {
      const menu = createFileMenu(false, () => mockWindow);

      const itemsToTest = [
        { label: 'Novo Arquivo', channel: 'menu:new-file' },
        { label: 'Abrir Arquivo...', channel: 'menu:open-file' },
        { label: 'Abrir Pasta...', channel: 'menu:open-folder' },
        { label: 'Salvar', channel: 'menu:save-file' },
        { label: 'Salvar Como...', channel: 'menu:save-file-as' },
        { label: 'Fechar Aba', channel: 'menu:close-tab' },
        { label: 'Recarregar Arquivo', channel: 'menu:reload-file' },
        { label: 'Exportar para HTML...', channel: 'menu:export-html' },
        { label: 'Imprimir / Exportar PDF...', channel: 'menu:export-pdf' }
      ];

      for (const { label, channel } of itemsToTest) {
        mockWindow.webContents.send.mockClear();
        const item = menu.submenu.find(i => i.label === label);
        expect(item).toBeDefined();
        item.click();
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(channel);
      }
    });

    it('should call app.quit on Sair click', () => {
      const menu = createFileMenu(false, () => mockWindow);
      const quitItem = menu.submenu.find(item => item.label === 'Sair');
      quitItem.click();
      expect(app.quit).toHaveBeenCalled();
    });

    it('should handle destroyed or missing window gracefully', () => {
      mockWindow.isDestroyed.mockReturnValue(true);
      const menu = createFileMenu(false, () => mockWindow);
      const newItem = menu.submenu.find(i => i.label === 'Novo Arquivo');
      expect(() => newItem.click()).not.toThrow();
      expect(mockWindow.webContents.send).not.toHaveBeenCalled();

      const menuNoWin = createFileMenu(false, null);
      const newItemNoWin = menuNoWin.submenu.find(i => i.label === 'Novo Arquivo');
      expect(() => newItemNoWin.click()).not.toThrow();
    });
  });

  describe('createEditMenu', () => {
    it('should configure Edit menu items correctly', () => {
      const menuNonMac = createEditMenu(false, () => mockWindow);
      expect(menuNonMac.label).toBe('Editar');

      const redoNonMac = menuNonMac.submenu.find(item => item.role === 'redo');
      expect(redoNonMac.accelerator).toBe('Ctrl+Y');

      const menuMac = createEditMenu(true, () => mockWindow);
      const redoMac = menuMac.submenu.find(item => item.role === 'redo');
      expect(redoMac.accelerator).toBe('Cmd+Shift+Z');
    });

    it('should trigger find IPC command when Localizar click handler is invoked', () => {
      const menu = createEditMenu(false, () => mockWindow);
      const findItem = menu.submenu.find(item => item.label === 'Localizar no Documento');
      findItem.click();
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('menu:find');
    });
  });

  describe('createViewMenu', () => {
    it('should send appropriate IPC channels for view menu actions', () => {
      const menu = createViewMenu(() => mockWindow);
      expect(menu.label).toBe('Visualizar');

      const actionMappings = [
        { label: 'Alternar Barra Lateral', channel: 'menu:toggle-sidebar', args: [] },
        { label: 'Alternar Índice (TOC)', channel: 'menu:toggle-toc', args: [] },
        { label: 'Modo Pré-visualização', channel: 'menu:set-view-mode', args: ['preview'] },
        { label: 'Modo Dividido (Split)', channel: 'menu:set-view-mode', args: ['split'] },
        { label: 'Modo Código Fonte', channel: 'menu:set-view-mode', args: ['source'] },
        { label: 'Aumentar Zoom', channel: 'menu:zoom-in', args: [] },
        { label: 'Diminuir Zoom', channel: 'menu:zoom-out', args: [] },
        { label: 'Restaurar Zoom', channel: 'menu:zoom-reset', args: [] }
      ];

      for (const { label, channel, args } of actionMappings) {
        mockWindow.webContents.send.mockClear();
        const item = menu.submenu.find(i => i.label === label);
        expect(item).toBeDefined();
        item.click();
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(channel, ...args);
      }
    });
  });

  describe('createHelpMenu', () => {
    it('should trigger IPC for sample and shortcuts, and show message box for About', () => {
      const menu = createHelpMenu(() => mockWindow);
      expect(menu.label).toBe('Ajuda');

      const sampleItem = menu.submenu.find(i => i.label === 'Abrir Documento de Exemplo');
      sampleItem.click();
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('menu:open-sample');

      mockWindow.webContents.send.mockClear();
      const shortcutsItem = menu.submenu.find(i => i.label === 'Atalhos de Teclado');
      shortcutsItem.click();
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('menu:show-shortcuts');

      const aboutItem = menu.submenu.find(i => i.label === 'Sobre o MDViewer');
      aboutItem.click();
      expect(dialog.showMessageBox).toHaveBeenCalledWith(mockWindow, expect.objectContaining({
        title: 'Sobre o MDViewer'
      }));
    });
  });

  describe('createAppMenu', () => {
    it('should build and set application menu using Menu API', () => {
      const menu = createAppMenu(() => mockWindow);
      expect(Menu.buildFromTemplate).toHaveBeenCalled();
      expect(Menu.setApplicationMenu).toHaveBeenCalledWith(menu);
      expect(menu).toHaveLength(4);
    });
  });
});
