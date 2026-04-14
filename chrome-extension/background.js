const SNAPVITE_URL = "https://snapvite-calendar-app.vercel.app";

// ── Context menu setup ────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "snapvite-image",
    title: "📅 Add to calendar with Snapvite",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: "snapvite-screenshot",
    title: "📅 Screenshot tab → Snapvite",
    contexts: ["page", "selection"],
  });
});

// ── Context menu: right-click an image ───────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "snapvite-image" && info.srcUrl) {
    await sendImageUrl(info.srcUrl, tab?.id);
  }
  if (info.menuItemId === "snapvite-screenshot" && tab?.id) {
    await captureTab(tab.id);
  }
});

// ── Message from popup: capture current tab ───────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "CAPTURE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (tab?.id) {
        await captureTab(tab.id);
        sendResponse({ ok: true });
      }
    });
    return true; // keep channel open for async response
  }
});

// ── Helpers ───────────────────────────────────────────────────────

async function sendImageUrl(srcUrl, tabId) {
  try {
    // Fetch the image from the page context (bypasses CORS for in-page images)
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (url) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const [, b64] = reader.result.split(",");
              resolve({ base64: b64, mediaType: blob.type || "image/jpeg" });
            };
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      },
      args: [srcUrl],
    });

    const result = results?.[0]?.result;
    if (!result) return;

    await openSnapvite(result.base64, result.mediaType);
  } catch (e) {
    console.error("[Snapvite] sendImageUrl error:", e);
  }
}

async function captureTab(tabId) {
  try {
    // Capture the visible area of the tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
      quality: 90,
    });
    const [, base64] = dataUrl.split(",");
    await openSnapvite(base64, "image/png");
  } catch (e) {
    console.error("[Snapvite] captureTab error:", e);
  }
}

async function openSnapvite(base64, mediaType) {
  // Store image temporarily in local storage with a UUID token
  const token = crypto.randomUUID();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  await chrome.storage.local.set({
    [`ext_${token}`]: { base64, mediaType, expiry },
  });

  // Clean up old tokens
  chrome.storage.local.get(null, (items) => {
    const now = Date.now();
    const toDelete = Object.keys(items).filter(
      (k) => k.startsWith("ext_") && items[k].expiry < now
    );
    if (toDelete.length) chrome.storage.local.remove(toDelete);
  });

  // Open Snapvite with the token
  chrome.tabs.create({ url: `${SNAPVITE_URL}/?ext=${token}` });
}
