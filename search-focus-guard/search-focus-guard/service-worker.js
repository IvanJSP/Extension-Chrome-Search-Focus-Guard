async function openSearchGuard(tabId) {
  let response;
  try {
    response = await chrome.tabs.sendMessage(tabId, { type: "toggle-search-guard" });
  } catch {
    response = undefined;
  }

  if (!response?.opened) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["content.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    response = await chrome.tabs.sendMessage(tabId, { type: "toggle-search-guard" });
  }

  if (!response?.opened) {
    throw new Error("Search Focus Guard could not open on this page.");
  }
}

chrome.commands.onCommand.addListener(async command => {
  if (command !== "open-search-guard-v2") {
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  try {
    await openSearchGuard(tab.id);
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
  } catch {
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#c5221f" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setTitle({
      tabId: tab.id,
      title: "Search Focus Guard no está disponible en esta página protegida."
    });
  }
});
