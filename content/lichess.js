// ── Content script for Lichess.org ──
// Detects when a game finishes and notifies the background service worker.
//
// Lichess is also a dynamic SPA. We watch for the result status element
// that appears when a game concludes.

(function () {
  "use strict";

  let gameReported = false;
  let lastGameUrl = "";

  // ── Notify background ──
  function reportGameFinished() {
    if (gameReported) return;
    gameReported = true;
    console.log("[CalmQuit] Lichess – game finished, reporting…");
    chrome.runtime.sendMessage({ type: "GAME_FINISHED" }, (res) => {
      if (res) console.log("[CalmQuit] Background responded:", res);
    });
  }

  // ── Detect game-over state ──
  // Lichess game pages show the result in these elements:
  //   • div.result-wrap          – wraps the result text
  //   • div.status               – "White is victorious", "Black is victorious", "Draw", etc.
  //   • .rresult                 – result badge (1-0, 0-1, ½-½)
  //   • div.follow-up            – rematch / new game buttons appear after game ends
  //
  // The .result-wrap only appears when the game is truly over.

  const GAME_OVER_SELECTORS = [
    ".result-wrap",                 // main result container
    ".rmatch__result",              // match result element
    "div.follow-up",               // rematch buttons section
  ];

  // Result text patterns that confirm the game is over
  const RESULT_PATTERNS = [
    /is victorious/i,
    /wins by/i,
    /drawn/i,
    /stalemate/i,
    /time out/i,
    /resign/i,
    /aborted/i,
    /checkmate/i,
    /½[–-]½/,
    /1[–-]0/,
    /0[–-]1/,
  ];

  function isGameOver() {
    // Check for result-wrap element
    for (const sel of GAME_OVER_SELECTORS) {
      if (document.querySelector(sel)) return true;
    }

    // Also check the status text in the game controls area
    const statusEl = document.querySelector(".rcontrols .status, .rclock .time");
    if (!statusEl) return false;

    // Check if the round status indicates the game ended
    const statusText = document.querySelector(".rcontrols")?.textContent || "";
    return RESULT_PATTERNS.some((pat) => pat.test(statusText));
  }

  // ── Check if we're on a game page ──
  function isGamePage() {
    const path = window.location.pathname;
    // Lichess game URLs are like /{gameId} (8 chars) or /{gameId}/{color}
    // Also matches /tournament/.../game, /swiss/.../game etc.
    return (
      /^\/[a-zA-Z0-9]{8,12}(\/\w+)?$/.test(path) ||
      path.includes("/game/") ||
      /^\/\w+\/\w+\/\w+/.test(path)
    );
  }

  // ── URL change detection ──
  function checkUrlChange() {
    const current = window.location.href;
    if (current !== lastGameUrl) {
      lastGameUrl = current;
      gameReported = false;
    }
  }

  // ── MutationObserver callback ──
  function onMutation() {
    checkUrlChange();
    if (!isGamePage()) return;
    if (isGameOver()) {
      reportGameFinished();
    }
  }

  // ── Start observing ──
  const observer = new MutationObserver(onMutation);
  observer.observe(document.body, { childList: true, subtree: true });

  // Run once on load
  if (isGamePage() && isGameOver()) {
    reportGameFinished();
  }

  // Backup URL polling
  setInterval(checkUrlChange, 1000);
})();
