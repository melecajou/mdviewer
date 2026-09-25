/**
 * @jest-environment jsdom
 */

global.MDViewerBase = require('../../shared/js/MDViewerBase');

// Mock chrome extension APIs before loading viewer.js
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

const MDViewerExtensionApp = require('./viewer');

describe('MDViewerExtensionApp', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('bindEvents & setup helper methods', () => {
    it('should call all setup helper methods during bindEvents', () => {
      const spySidebar = jest.spyOn(MDViewerExtensionApp.prototype, 'setupSidebarEvents').mockImplementation(() => {});
      const spyFileToolbar = jest.spyOn(MDViewerExtensionApp.prototype, 'setupFileAndToolbarEvents').mockImplementation(() => {});
      const spyEditorScroll = jest.spyOn(MDViewerExtensionApp.prototype, 'setupEditorAndScrollEvents').mockImplementation(() => {});
      const spyViewTheme = jest.spyOn(MDViewerExtensionApp.prototype, 'setupViewAndThemeEvents').mockImplementation(() => {});
      const spyFindModal = jest.spyOn(MDViewerExtensionApp.prototype, 'setupFindAndModalEvents').mockImplementation(() => {});
      const spyDragDrop = jest.spyOn(MDViewerExtensionApp.prototype, 'setupDragAndDropEvents').mockImplementation(() => {});
      const spyKeyboardWindow = jest.spyOn(MDViewerExtensionApp.prototype, 'setupKeyboardAndWindowEvents').mockImplementation(() => {});

      // Instantiate app (which calls init -> cacheElements -> bindEvents)
      app = new MDViewerExtensionApp();

      expect(spySidebar).toHaveBeenCalled();
      expect(spyFileToolbar).toHaveBeenCalled();
      expect(spyEditorScroll).toHaveBeenCalled();
      expect(spyViewTheme).toHaveBeenCalled();
      expect(spyFindModal).toHaveBeenCalled();
      expect(spyDragDrop).toHaveBeenCalled();
      expect(spyKeyboardWindow).toHaveBeenCalled();

      spySidebar.mockRestore();
      spyFileToolbar.mockRestore();
      spyEditorScroll.mockRestore();
      spyViewTheme.mockRestore();
      spyFindModal.mockRestore();
      spyDragDrop.mockRestore();
      spyKeyboardWindow.mockRestore();
    });

    it('setupSidebarEvents should attach click handler to btnToggleSidebar', () => {
      const btn = document.createElement('button');
      btn.id = 'btn-toggle-sidebar';
      document.body.appendChild(btn);

      app = new MDViewerExtensionApp();
      const toggleSpy = jest.spyOn(app, 'toggleSidebar').mockImplementation(() => {});

      btn.click();
      expect(toggleSpy).toHaveBeenCalled();
    });

    it('setupViewAndThemeEvents should attach click handlers to view mode buttons', () => {
      const btnPreview = document.createElement('button');
      btnPreview.id = 'btn-view-preview';
      const btnSplit = document.createElement('button');
      btnSplit.id = 'btn-view-split';
      const btnSource = document.createElement('button');
      btnSource.id = 'btn-view-source';

      document.body.appendChild(btnPreview);
      document.body.appendChild(btnSplit);
      document.body.appendChild(btnSource);

      app = new MDViewerExtensionApp();
      const setViewModeSpy = jest.spyOn(app, 'setViewMode').mockImplementation(() => {});

      btnPreview.click();
      expect(setViewModeSpy).toHaveBeenCalledWith('preview');

      btnSplit.click();
      expect(setViewModeSpy).toHaveBeenCalledWith('split');

      btnSource.click();
      expect(setViewModeSpy).toHaveBeenCalledWith('source');
    });

    it('setupFileAndToolbarEvents should attach click handler to btnNewFile', () => {
      const btnNew = document.createElement('button');
      btnNew.id = 'btn-new-file';
      document.body.appendChild(btnNew);

      app = new MDViewerExtensionApp();
      const newFileSpy = jest.spyOn(app, 'handleNewFile').mockImplementation(() => {});

      btnNew.click();
      expect(newFileSpy).toHaveBeenCalled();
    });
  });
});
