// ── DOM refs ──
const gameLimitInput = document.getElementById("gameLimit");
const enabledCheckbox = document.getElementById("enabled");
const gameCountLabel = document.getElementById("gameCount");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");
const decrementBtn = document.getElementById("decrement");
const incrementBtn = document.getElementById("increment");
const warningSection = document.getElementById("warningSection");
const warningText = document.getElementById("warningText");

// ── Defaults ──
const DEFAULTS = { gameLimit: 3, enabled: true, gamesPlayed: 0 };

// ── Load state from storage ──
function loadState() {
  chrome.storage.local.get(DEFAULTS, (data) => {
    gameLimitInput.value = data.gameLimit;
    enabledCheckbox.checked = data.enabled;
    updateProgress(data.gamesPlayed, data.gameLimit);
    updateWarning(data.gamesPlayed, data.gameLimit, data.enabled);
  });
}

// ── Persist helpers ──
function save(obj) {
  chrome.storage.local.set(obj);
}

// ── UI update helpers ──
function updateProgress(played, limit) {
  gameCountLabel.textContent = `${played} / ${limit}`;
  const pct = Math.min((played / limit) * 100, 100);
  progressFill.style.width = `${pct}%`;
}

function updateWarning(played, limit, enabled) {
  if (!enabled) {
    warningSection.style.display = "block";
    warningText.textContent = "CalmQuit is paused — games won't be counted.";
    warningSection.style.background = "#1f2d3d";
    warningSection.style.borderColor = "#30506b";
    warningText.style.color = "#90c0ff";
    return;
  }
  const remaining = limit - played;
  if (remaining <= 1 && remaining > 0) {
    warningSection.style.display = "block";
    warningText.textContent = "⚠ Last game! Browser will close after this one.";
    warningSection.style.background = "#3d1f1f";
    warningSection.style.borderColor = "#6b3030";
    warningText.style.color = "#ff9090";
  } else if (remaining <= 0) {
    warningSection.style.display = "block";
    warningText.textContent = "Limit reached. Browser will close after the current game ends.";
    warningSection.style.background = "#3d1f1f";
    warningSection.style.borderColor = "#6b3030";
    warningText.style.color = "#ff9090";
  } else {
    warningSection.style.display = "none";
  }
}

// ── Event listeners ──
gameLimitInput.addEventListener("change", () => {
  let val = parseInt(gameLimitInput.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 99) val = 99;
  gameLimitInput.value = val;
  save({ gameLimit: val });
  chrome.storage.local.get(["gamesPlayed", "enabled"], (data) => {
    updateProgress(data.gamesPlayed ?? 0, val);
    updateWarning(data.gamesPlayed ?? 0, val, data.enabled ?? true);
  });
});

decrementBtn.addEventListener("click", () => {
  let val = parseInt(gameLimitInput.value, 10) - 1;
  if (val < 1) val = 1;
  gameLimitInput.value = val;
  gameLimitInput.dispatchEvent(new Event("change"));
});

incrementBtn.addEventListener("click", () => {
  let val = parseInt(gameLimitInput.value, 10) + 1;
  if (val > 99) val = 99;
  gameLimitInput.value = val;
  gameLimitInput.dispatchEvent(new Event("change"));
});

enabledCheckbox.addEventListener("change", () => {
  const on = enabledCheckbox.checked;
  save({ enabled: on });
  chrome.storage.local.get(["gamesPlayed", "gameLimit"], (data) => {
    updateWarning(data.gamesPlayed ?? 0, data.gameLimit ?? 3, on);
  });
});

resetBtn.addEventListener("click", () => {
  save({ gamesPlayed: 0 });
  chrome.storage.local.get(["gameLimit", "enabled"], (data) => {
    updateProgress(0, data.gameLimit ?? 3);
    updateWarning(0, data.gameLimit ?? 3, data.enabled ?? true);
  });
});

// ── Listen for live storage changes (e.g. game finishes while popup is open) ──
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  chrome.storage.local.get(DEFAULTS, (data) => {
    gameLimitInput.value = data.gameLimit;
    enabledCheckbox.checked = data.enabled;
    updateProgress(data.gamesPlayed, data.gameLimit);
    updateWarning(data.gamesPlayed, data.gameLimit, data.enabled);
  });
});

// ── Init ──
loadState();
