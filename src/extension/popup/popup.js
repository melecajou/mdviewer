// MDViewer Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const btnWorkspace = document.getElementById('btn-open-workspace');
  const btnOpenFile = document.getElementById('btn-open-file');
  const fileInput = document.getElementById('file-input-picker');
  const themeSelect = document.getElementById('theme-select');
  const btnConfigTip = document.getElementById('btn-open-extensions-page');

  // Carregar tema salvo
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme) {
      themeSelect.value = result.theme;
    }
  });

  // Salvar tema ao mudar
  themeSelect.addEventListener('change', (e) => {
    const newTheme = e.target.value;
    chrome.storage.local.set({ theme: newTheme });
  });

  // Abrir Workspace Tab
  btnWorkspace.addEventListener('click', () => {
    const viewerUrl = chrome.runtime.getURL('viewer/viewer.html');
    chrome.tabs.create({ url: viewerUrl });
    window.close();
  });

  // Abrir Seletor de Arquivo
  btnOpenFile.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const viewerUrl = chrome.runtime.getURL('viewer/viewer.html');

    // Abre o viewer e passa o conteúdo via runtime
    chrome.tabs.create({ url: viewerUrl }, (tab) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tab.id, {
            action: 'loadInitialDoc',
            filename: file.name,
            content: text
          });
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      window.close();
    });
  });

  // Instrução de configuração de URLs locais
  btnConfigTip.addEventListener('click', () => {
    const extId = chrome.runtime.id;
    chrome.tabs.create({
      url: `chrome://extensions/?id=${extId}`
    });
    window.close();
  });
});
