# CalmQuit – Chess Game Limiter

CalmQuit is a Chrome extension that helps you end chess sessions on time. Inspired by the Rocket League Bakkesmod plugin with the same name.
It tracks finished games on **Chess.com** and **Lichess.org**, then applies your chosen close action after you reach a game limit.

## Features

- Set a custom game limit (1–99 games)
- Enable or pause tracking from the popup
- Choose what to close when limit is reached:
  - Current tab
  - All chess tabs (default)
  - Entire browser
- Live progress display (`gamesPlayed / gameLimit`)
- Warning when you are on your last game
- One-click counter reset
- Auto-detection of finished games on:
  - Chess.com
  - Lichess.org

## How it works

1. Content scripts detect when a game has finished.
2. They send a `GAME_FINISHED` message to the background service worker.
3. The background script increments `gamesPlayed` in `chrome.storage.local`.
4. If `gamesPlayed >= gameLimit`, CalmQuit waits 3 seconds and then applies the selected close mode.

## Installation (Developer mode)

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked**.
5. Select the project folder (`Chess-CalmQuit`).

The extension icon should appear in your toolbar.

## Usage

1. Click the CalmQuit extension icon.
2. Set **Close browser after _N_ games**.
3. Choose **When limit is reached** behavior.
4. Keep **Enabled** turned on.
5. Play on Chess.com or Lichess.
6. When the limit is reached, CalmQuit applies the selected close action after your game ends.

To start a new session, click **Reset Counter** in the popup.

## Stored state

CalmQuit stores these values in `chrome.storage.local`:

- `gameLimit` (default: `3`)
- `enabled` (default: `true`)
- `gamesPlayed` (default: `0`)
- `closeMode` (default: `all_chess_tabs`)

## Permissions

Defined in `manifest.json`:

- `storage` – save settings and session progress
- `tabs` – required by extension APIs used by the background flow
- Content script matches:
  - `*://*.chess.com/*`
  - `*://*.lichess.org/*`

## Project structure

- `manifest.json` – extension configuration (MV3)
- `background.js` – game counting + auto-close logic
- `content/chess-com.js` – Chess.com game-finish detection
- `content/lichess.js` – Lichess game-finish detection
- `popup/popup.html` – popup UI
- `popup/popup.css` – popup styling
- `popup/popup.js` – popup interactions + state sync
- `icons/` – extension icons

## Notes

- This extension is designed for Chromium-based browsers that support Manifest V3.
- Because game sites are dynamic SPAs, detection relies on DOM changes and URL monitoring.
- If a site updates its markup, selectors may need adjustment in content scripts.

## Privacy

CalmQuit does not collect, store, or share any user data. All functionality runs locally
in the browser and only the game‑limit setting is saved via chrome.storage.
