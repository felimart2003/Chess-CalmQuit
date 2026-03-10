// ── Background service worker ──
// Listens for messages from content scripts reporting a finished game,
// increments the counter, and closes the browser when the limit is reached.

const DEFAULTS = { gameLimit: 3, enabled: true, gamesPlayed: 0 };

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
        // Give a small delay so the user can see the result screen
        setTimeout(() => {
            // Try to close only the tab where the message originated.
            // `sender.tab` is defined for messages sent from a content script.
            const tabId = sender && sender.tab && sender.tab.id;
            if (typeof tabId === "number") {
              chrome.tabs.remove(tabId);
            } else {
              // fallback to closing all windows (previous behaviour)
              chrome.windows.getAll({}, (windows) => {
                for (const w of windows) {
                  chrome.windows.remove(w.id);
                }
              });
            }

// Reset counter when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (existing) => {
    // Only set defaults for keys that don't exist yet
    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (existing[k] === undefined) toSet[k] = v;
    }
    if (Object.keys(toSet).length) chrome.storage.local.set(toSet);
  });
});
