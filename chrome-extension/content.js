// Content script — runs on the Snapvite app at document_start.
// It fetches the image that background.js stashed in chrome.storage.local
// and hands it to the page. Uses a ready/ack handshake so it can't lose
// the message to a race with React hydration.

(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("ext");
  if (!token) return;

  const storageKey = `ext_${token}`;
  let payload = null;
  let delivered = false;
  let retryTimer = null;

  function deliver() {
    if (delivered || !payload) return;
    window.postMessage(
      {
        type: "SNAPVITE_EXT_IMAGE",
        base64: payload.base64,
        mediaType: payload.mediaType,
      },
      window.location.origin
    );
  }

  // Page confirms receipt — stop retrying and clean up.
  window.addEventListener("message", (e) => {
    if (e.source !== window) return;
    if (e.data?.type === "SNAPVITE_EXT_READY" && payload) {
      deliver();
    }
    if (e.data?.type === "SNAPVITE_EXT_ACK") {
      delivered = true;
      if (retryTimer) clearInterval(retryTimer);
      chrome.storage.local.remove(storageKey).catch(() => {});
    }
  });

  chrome.storage.local.get(storageKey, (items) => {
    const entry = items?.[storageKey];
    if (!entry) return;
    if (entry.expiry <= Date.now()) {
      chrome.storage.local.remove(storageKey).catch(() => {});
      return;
    }
    payload = entry;

    // Post immediately — the page may already be listening.
    deliver();

    // Keep retrying every 150ms until we get an ACK, up to ~8s.
    // This closes the race with React mounting its message listener.
    const started = Date.now();
    retryTimer = setInterval(() => {
      if (delivered || Date.now() - started > 8000) {
        clearInterval(retryTimer);
        return;
      }
      deliver();
    }, 150);
  });
})();
