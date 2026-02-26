// ── Content script for Chess.com ──
// Detects when a game finishes and notifies the background service worker.
//
// Chess.com is a single-page app — games load dynamically, so we use
// MutationObserver to watch for game-over indicators.

(function () {
  "use strict";

  let gameReported = false; // prevent duplicate reports for the same game
  let lastGameUrl = ""; // track URL to reset flag on new game

  // ── Notify background ──
  function reportGameFinished() {
    if (gameReported) return;
    gameReported = true;
    console.log("[CalmQuit] Chess.com – game finished, reporting…");
    chrome.runtime.sendMessage({ type: "GAME_FINISHED" }, (res) => {
      if (res) console.log("[CalmQuit] Background responded:", res);
    });
  }

  // ── Detect game-over state ──
  // Chess.com shows a modal/overlay when the game ends. The key selectors:
  //   • board-modal-container (game-over modal wrapper)
  //   • .game-over-modal
  //   • div[data-cy="game-over-modal"]
  //   • .board-modal-header-text  (contains "You won", "You lost", etc.)
  //
  // For live games, the result also appears in the move list as a result token.

  const GAME_OVER_SELECTORS = [
    ".game-over-modal",
    "[data-cy='game-over-modal']",
    ".board-modal-container .board-modal-header",
    ".game-review-buttons-component",     // review button appears after game ends
  ];

  function isGameOver() {
    return GAME_OVER_SELECTORS.some((sel) => document.querySelector(sel));
  }

  // ── Check if we're on a game page ──
  function isGamePage() {
    const path = window.location.pathname;
    return (
      path.startsWith("/game/live") ||
      path.startsWith("/game/daily") ||
      path.startsWith("/live") ||
      path.startsWith("/play")
    );
  }

  // ── URL change detection (SPA navigation) ──
  function checkUrlChange() {
    const current = window.location.href;
    if (current !== lastGameUrl) {
      lastGameUrl = current;
      gameReported = false; // new page/game → allow a new report
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

  // Also run once on load in case the page already shows a finished game
  if (isGamePage() && isGameOver()) {
    reportGameFinished();
  }

  // Poll URL changes for SPA navigation (backup for pushState)
  setInterval(checkUrlChange, 1000);
})();
