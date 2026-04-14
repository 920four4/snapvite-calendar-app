const btn = document.getElementById("btn-screenshot");
const statusEl = document.getElementById("status");

function showStatus(type, icon, text) {
  statusEl.className = `status ${type}`;
  statusEl.innerHTML = type === "loading"
    ? `<div class="spinner"></div>${text}`
    : `<span>${icon}</span>${text}`;
}

function hideStatus() {
  statusEl.className = "status hidden";
}

btn.addEventListener("click", async () => {
  btn.disabled = true;
  showStatus("loading", "", "Taking screenshot…");

  try {
    await chrome.runtime.sendMessage({ type: "CAPTURE_TAB" });
    showStatus("success", "✅", "Opening Snapvite…");
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    console.error(err);
    showStatus("error", "⚠️", "Couldn't capture the tab. Try refreshing.");
    btn.disabled = false;
  }
});
