// Content script — runs on snapvite-calendar-app.vercel.app
// Reads the ?ext=<token> param, fetches image from chrome.storage,
// and posts it to the page so HomeClient can pick it up.

(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("ext");
  if (!token) return;

  const storageKey = `ext_${token}`;

  chrome.storage.local.get(storageKey, (items) => {
    const entry = items[storageKey];
    if (!entry) return;
    if (entry.expiry < Date.now()) {
      chrome.storage.local.remove(storageKey);
      return;
    }

    // Post to the page — HomeClient listens for this
    window.postMessage(
      {
        type: "SNAPVITE_EXT_IMAGE",
        base64: entry.base64,
        mediaType: entry.mediaType,
      },
      window.location.origin
    );

    // Clean up immediately after posting
    chrome.storage.local.remove(storageKey);
  });
})();
