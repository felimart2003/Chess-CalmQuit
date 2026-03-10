// ── Background service worker ──
// Listens for messages from content scripts reporting a finished game,
// increments the counter, and applies the configured close behaviour.

const CLOSE_MODES = {
  CURRENT_TAB: "current_tab",
  ALL_CHESS_TABS: "all_chess_tabs",
  ENTIRE_BROWSER: "entire_browser",
};

const DEFAULTS = {
  gameLimit: 3,
  enabled: true,
  gamesPlayed: 0,
  closeMode: CLOSE_MODES.ALL_CHESS_TABS,
};

function closeSenderTab(sender) {
  const tabId = sender && sender.tab && sender.tab.id;
  if (typeof tabId === "number") {
    chrome.tabs.remove(tabId);
    return;
  }

  // Fallback: if sender tab is unavailable, close chess tabs.
  closeAllChessTabs();
}

function closeAllChessTabs() {
  chrome.tabs.query(
    {
      url: ["*://*.chess.com/*", "*://*.lichess.org/*"],
    },
    (tabs) => {
      const ids = tabs.map((t) => t.id).filter((id) => typeof id === "number");
      if (ids.length) {
        chrome.tabs.remove(ids);
      }
    }
  );
}

function closeEntireBrowser() {
  chrome.windows.getAll({}, (windows) => {
    for (const w of windows) {
      chrome.windows.remove(w.id);
    }
  });
}

function applyCloseMode(mode, sender) {
  switch (mode) {
    case CLOSE_MODES.CURRENT_TAB:
      closeSenderTab(sender);
      break;
    case CLOSE_MODES.ENTIRE_BROWSER:
      closeEntireBrowser();
      break;
    case CLOSE_MODES.ALL_CHESS_TABS:
    default:
      closeAllChessTabs();
      break;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GAME_FINISHED") return;

  chrome.storage.local.get(DEFAULTS, (data) => {
    if (!data.enabled) {
      sendResponse({ action: "ignored" });
      return;
    }

    const played = data.gamesPlayed + 1;
    chrome.storage.local.set({ gamesPlayed: played }, () => {
      if (played >= data.gameLimit) {
        // Give a small delay so the user can see the result screen.
        setTimeout(() => {
          applyCloseMode(data.closeMode, sender);
        }, 3000);

        sendResponse({
          action: "closing",
          played,
          limit: data.gameLimit,
          closeMode: data.closeMode,
        });
      } else {
        sendResponse({ action: "counted", played, limit: data.gameLimit });
      }
    });
  });

  // Keep the message channel open for async sendResponse.
  return true;
});

// Reset counter and defaults when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (existing) => {
    // Only set defaults for keys that do not exist yet.
    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (existing[k] === undefined) toSet[k] = v;
    }
    if (Object.keys(toSet).length) chrome.storage.local.set(toSet);
  });
});
