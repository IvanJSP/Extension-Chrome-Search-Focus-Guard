const status = document.getElementById("status");
const defaultSearchInput = document.getElementById("default-search");

const defaultSearchReady = chrome.storage.local.get("defaultSearch").then(({ defaultSearch }) => {
  if (typeof defaultSearch === "string") {
    defaultSearchInput.value = defaultSearch;
  }
  return true;
}).catch(error => {
  status.textContent = "No se pudo cargar el texto predeterminado.";
  console.error("Search Focus Guard could not load the default search.", error);
  return false;
});

document.getElementById("save-search").addEventListener("click", async () => {
  try {
    if (!await defaultSearchReady) {
      return;
    }
    await chrome.storage.local.set({ defaultSearch: defaultSearchInput.value });
    status.textContent = defaultSearchInput.value
      ? "Texto predeterminado guardado."
      : "Se usará la última búsqueda.";
  } catch (error) {
    status.textContent = "No se pudo guardar el texto predeterminado.";
    console.error("Search Focus Guard could not save the default search.", error);
  }
});

document.getElementById("open-search").addEventListener("click", async () => {
  try {
    if (!await defaultSearchReady) {
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error("No se encontró la pestaña activa.");
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: "toggle-search-guard" });
    } catch {
      response = undefined;
    }

    if (!response?.opened) {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content.css"]
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      response = await chrome.tabs.sendMessage(tab.id, { type: "toggle-search-guard" });
    }

    if (!response?.opened) {
      throw new Error("No se pudo abrir la barra en esta página.");
    }
    window.close();
  } catch (error) {
    status.textContent = error.message === "No se pudo abrir la barra en esta página."
      ? error.message
      : "Chrome no permite extensiones en esta página protegida.";
  }
});
