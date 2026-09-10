// MDViewer Chrome Extension - Service Worker (Background)

chrome.runtime.onInstalled.addListener(() => {
  // Configurar padrões de armazenamento
  chrome.storage.local.get(['theme', 'zoomLevel', 'viewMode'], (result) => {
    if (!result.theme) {
      chrome.storage.local.set({
        theme: 'github-dark',
        zoomLevel: 1.0,
        viewMode: 'preview',
        recentFiles: []
      });
    }
  });

  // Criar item de menu de contexto para links e seleção
  chrome.contextMenus.create({
    id: 'open-in-mdviewer',
    title: 'Abrir no MDViewer Workspace',
    contexts: ['link', 'page']
  });
});

// Manipulador do menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-in-mdviewer') {
    const targetUrl = info.linkUrl || info.pageUrl;
    openViewerTab(targetUrl);
  }
});

// Comunicação via mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openViewer') {
    openViewerTab(message.url, message.content, message.filename);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getSettings') {
    chrome.storage.local.get(['theme', 'zoomLevel', 'viewMode', 'recentFiles'], (data) => {
      sendResponse(data);
    });
    return true; // resposta assíncrona
  }

  if (message.action === 'saveSettings') {
    chrome.storage.local.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

function openViewerTab(url = null, content = null, filename = null) {
  const viewerUrl = chrome.runtime.getURL('viewer/viewer.html');
  
  chrome.tabs.create({ url: viewerUrl }, (tab) => {
    if (url || content) {
      // Aguardar carregar a aba e enviar o conteúdo inicial
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tab.id, {
            action: 'loadInitialDoc',
            url,
            content,
            filename
          });
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    }
  });
}
