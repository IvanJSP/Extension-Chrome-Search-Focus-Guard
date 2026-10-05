(() => {
  const INSTALL_KEY = Symbol.for("search-guard.installed");
  if (globalThis[INSTALL_KEY]) {
    return;
  }
  globalThis[INSTALL_KEY] = true;

  const HIGHLIGHT_NAME = "search-guard-results";
  const HOST_ID = "search-guard-host";
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
    "BUTTON"
  ]);

  let host;
  let input;
  let countLabel;
  let guardStatus;
  let matches = [];
  let hasMatches = false;
  let highlightedDocuments = new Set();
  let mutationObservers = new Map();
  let mutationTimer;
  let activeMatch = -1;

  function observeRoot(root) {
    if (mutationObservers.has(root)) {
      return;
    }

    const ownerDocument = root.nodeType === Node.DOCUMENT_NODE ? root : root.ownerDocument;
    const MutationObserverConstructor = ownerDocument.defaultView?.MutationObserver;
    if (!MutationObserverConstructor) {
      return;
    }

    const observer = new MutationObserverConstructor(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        if (input?.value) {
          const hadMatches = matches.length > 0;
          updateSearch({ autoNavigate: !hadMatches });
        }
      }, 120);
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"]
    });
    mutationObservers.set(root, observer);
  }

  function isVisibleTextNode(node) {
    const parent = node.parentElement;
    if (!parent || !node.nodeValue.trim()) {
      return false;
    }

    const style = parent.ownerDocument.defaultView?.getComputedStyle(parent);
    if (!style || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") {
      return false;
    }

    const range = parent.ownerDocument.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length > 0;
  }

  function updateGuardStatus() {
    if (!guardStatus) {
      return;
    }

    if (!hasMatches) {
      guardStatus.textContent = "";
      return;
    }

    guardStatus.textContent = navigator.userActivation?.hasBeenActive
      ? "Aviso de cierre activo"
      : "Chrome requiere una interacción para mostrar el aviso.";
  }

  function getSearchableTextNodes() {
    const nodes = [];
    const pendingRoots = [document.body || document.documentElement];
    const visitedRoots = new Set();

    while (pendingRoots.length) {
      const root = pendingRoots.pop();
      if (!root || visitedRoots.has(root)) {
        continue;
      }
      visitedRoots.add(root);
      observeRoot(root);

      const ownerDocument = root.nodeType === Node.DOCUMENT_NODE ? root : root.ownerDocument;
      const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let current;

      while ((current = walker.nextNode())) {
        if (current.nodeType === Node.TEXT_NODE) {
          const parent = current.parentElement;
          if (
            parent &&
            !parent.closest(`#${HOST_ID}, [contenteditable="true"]`) &&
            !SKIP_TAGS.has(parent.tagName) &&
            isVisibleTextNode(current)
          ) {
            nodes.push(current);
          }
          continue;
        }

        if (current.shadowRoot) {
          pendingRoots.push(current.shadowRoot);
        }

        if (current.tagName === "IFRAME" || current.tagName === "FRAME") {
          try {
            const frameDocument = current.contentDocument;
            if (frameDocument?.body) {
              pendingRoots.push(frameDocument.body);
            }
          } catch {
            // Cross-origin frames are intentionally not accessible.
          }
        }
      }
    }

    return nodes;
  }

  function clearHighlights() {
    for (const ownerDocument of highlightedDocuments) {
      ownerDocument.defaultView?.CSS?.highlights?.delete(HIGHLIGHT_NAME);
    }
    highlightedDocuments.clear();
  }

  function updateSearch({ autoNavigate = true } = {}) {
    clearHighlights();
    matches = [];
    hasMatches = false;
    activeMatch = -1;

    const query = input.value;
    if (!query) {
      countLabel.textContent = "0 coincidencias";
      updateGuardStatus();
      return;
    }

    const rangesByDocument = new Map();
    const foldedQuery = query.toLocaleLowerCase();

    for (const node of getSearchableTextNodes()) {
      const text = node.nodeValue;
      const foldedText = text.toLocaleLowerCase();
      let offset = 0;
      let index;

      while ((index = foldedText.indexOf(foldedQuery, offset)) !== -1) {
        const ownerDocument = node.ownerDocument;
        const range = ownerDocument.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + query.length);
        const ranges = rangesByDocument.get(ownerDocument) || [];
        ranges.push(range);
        rangesByDocument.set(ownerDocument, ranges);
        matches.push(range);
        offset = index + Math.max(query.length, 1);
      }
    }

    for (const [ownerDocument, ranges] of rangesByDocument) {
      const pageWindow = ownerDocument.defaultView;
      const highlightRegistry = pageWindow?.CSS?.highlights;
      if (highlightRegistry && pageWindow.Highlight) {
        highlightRegistry.set(HIGHLIGHT_NAME, new pageWindow.Highlight(...ranges));
        highlightedDocuments.add(ownerDocument);
      }
    }

    hasMatches = matches.length > 0;
    countLabel.textContent = `${matches.length} ${matches.length === 1 ? "coincidencia" : "coincidencias"}`;
    updateGuardStatus();
    if (matches.length && autoNavigate) {
      navigateMatch(1);
    }
  }

  function navigateMatch(direction) {
    if (!matches.length) {
      return;
    }

    activeMatch = (activeMatch + direction + matches.length) % matches.length;
    const range = matches[activeMatch];
    range.startContainer.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    countLabel.textContent = `${activeMatch + 1} de ${matches.length}`;
  }

  function closeBar() {
    clearHighlights();
    host?.remove();
    host = undefined;
    input = undefined;
    countLabel = undefined;
    guardStatus = undefined;
    matches = [];
    hasMatches = false;
    highlightedDocuments.clear();
    for (const observer of mutationObservers.values()) {
      observer.disconnect();
    }
    mutationObservers.clear();
    clearTimeout(mutationTimer);
    activeMatch = -1;
  }

  function createBar() {
    host = document.createElement("div");
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .bar {
          display: flex; align-items: center; gap: 6px; padding: 8px;
          border: 1px solid #777; border-radius: 8px; background: #fff;
          color: #222; box-shadow: 0 2px 12px #0005;
          font: 13px/1.3 Arial, sans-serif;
        }
        input { width: 220px; padding: 6px; border: 1px solid #999; border-radius: 4px; font: inherit; }
        button { padding: 5px 8px; border: 1px solid #aaa; border-radius: 4px; background: #f5f5f5; cursor: pointer; font: inherit; }
        button:hover { background: #e8e8e8; }
        .count { min-width: 95px; text-align: center; }
        .guard { color: #8a4b00; font-size: 11px; }
        .guard-status { max-width: 180px; }
      </style>
      <div class="bar" role="search">
        <input type="search" aria-label="Buscar en esta página" placeholder="Buscar en esta página">
        <span class="count" aria-live="polite">0 coincidencias</span>
        <span class="guard"><span class="guard-status" aria-live="polite"></span></span>
        <button class="previous" type="button" aria-label="Coincidencia anterior">▲</button>
        <button class="next" type="button" aria-label="Coincidencia siguiente">▼</button>
        <button class="close" type="button" aria-label="Cerrar búsqueda">×</button>
      </div>
    `;

    input = shadow.querySelector("input");
    countLabel = shadow.querySelector(".count");
    guardStatus = shadow.querySelector(".guard-status");
    let inputChanged = false;
    input.addEventListener("input", () => {
      inputChanged = true;
      chrome.storage.local.set({ lastSearch: input.value }).catch(error => {
        console.error("Search Focus Guard could not save the last search.", error);
      });
      updateSearch();
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        navigateMatch(event.shiftKey ? -1 : 1);
      } else if (event.key === "Escape") {
        closeBar();
      } else if (event.key.toLowerCase() === "v" && (event.ctrlKey || event.metaKey) && !event.altKey) {
        event.preventDefault();
        restoreConfiguredSearch(input);
      }
    });
    input.addEventListener("paste", event => {
      event.preventDefault();
      restoreConfiguredSearch(input);
    });
    shadow.querySelector(".previous").addEventListener("click", () => navigateMatch(-1));
    shadow.querySelector(".next").addEventListener("click", () => navigateMatch(1));
    shadow.querySelector(".close").addEventListener("click", closeBar);
    (document.body || document.documentElement).appendChild(host);
    input.focus();
    getSearchableTextNodes();

    const barInput = input;
    chrome.storage.local.get(["defaultSearch", "lastSearch"]).then(({ defaultSearch, lastSearch }) => {
      if (inputChanged || input !== barInput) {
        return;
      }

      const searchText = typeof defaultSearch === "string" && defaultSearch
        ? defaultSearch
        : lastSearch;
      if (typeof searchText === "string" && searchText) {
        input.value = searchText;
        updateSearch();
      }
    }).catch(error => {
      console.error("Search Focus Guard could not restore the saved search.", error);
    });
  }

  function toggleBar() {
    if (host) {
      input.focus();
      return;
    }
    createBar();
  }

  function restoreConfiguredSearch(targetInput) {
    chrome.storage.local.get(["defaultSearch", "lastSearch"]).then(({ defaultSearch, lastSearch }) => {
      if (input !== targetInput) {
        return;
      }

      const searchText = typeof defaultSearch === "string" && defaultSearch
        ? defaultSearch
        : lastSearch;
      targetInput.value = typeof searchText === "string" ? searchText : "";
      updateSearch();
    }).catch(error => {
      console.error("Search Focus Guard could not restore the configured search.", error);
    });
  }

  window.addEventListener("beforeunload", event => {
    if (hasMatches) {
      event.preventDefault();
      event.returnValue = " ";
    }
  }, true);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "toggle-search-guard") {
      toggleBar();
      sendResponse({ opened: Boolean(host) });
    }
  });
})();
