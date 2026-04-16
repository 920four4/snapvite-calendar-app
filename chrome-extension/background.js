const SNAPVITE_URL = "https://snapvite-calendar-app.vercel.app";

// ── Setup ─────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "snapvite-image",
    title: "📅 Add to calendar with Snapvite",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: "snapvite-screenshot",
    title: "📅 Screenshot this page → Snapvite",
    contexts: ["page", "selection"],
  });
});

// ── Single-click action: capture the active tab ──────────────────
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  if (!isCapturableUrl(tab.url)) {
    notifyError(
      "Can't screenshot this page",
      "Chrome blocks captures on chrome://, the Web Store, and new-tab pages. Try a regular webpage."
    );
    return;
  }
  await captureTab(tab);
});

// ── Context menu clicks ──────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "snapvite-image" && info.srcUrl && tab?.id) {
    await sendImageUrl(info.srcUrl, tab.id);
    return;
  }
  if (info.menuItemId === "snapvite-screenshot" && tab) {
    await captureTab(tab);
  }
});

// ── Helpers ──────────────────────────────────────────────────────

function isCapturableUrl(url) {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || url.startsWith("file://");
}

async function setBadge(text, color) {
  try {
    await chrome.action.setBadgeText({ text });
    if (color) await chrome.action.setBadgeBackgroundColor({ color });
  } catch {
    /* badge is cosmetic — never block on failure */
  }
}

function clearBadgeAfter(ms) {
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" }).catch(() => {});
  }, ms);
}

async function notifyError(title, message) {
  await setBadge("!", "#ff5e5b");
  clearBadgeAfter(4000);
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
      title,
      message,
      priority: 1,
    });
  } catch {
    /* notifications are cosmetic */
  }
}

async function sendImageUrl(srcUrl, tabId) {
  await setBadge("…", "#ff5e5b");
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const [, b64] = reader.result.split(",");
              resolve({ base64: b64, mediaType: blob.type || "image/jpeg" });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      },
      args: [srcUrl],
    });

    const result = results?.[0]?.result;
    if (!result) {
      await notifyError(
        "Couldn't grab that image",
        "The page blocked the fetch. Try taking a tab screenshot instead."
      );
      return;
    }

    await openSnapvite(result.base64, result.mediaType);
  } catch (e) {
    console.error("[Snapvite] sendImageUrl error:", e);
    await notifyError("Couldn't grab that image", "Please try again.");
  }
}

async function captureTab(tab) {
  await setBadge("…", "#ff5e5b");
  try {
    // Scope to the tab's window — `null` picks "current" which can drift
    // when multiple windows are open and has caused flaky captures.
    const windowId = tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format: "png",
    });
    if (!dataUrl) throw new Error("captureVisibleTab returned empty");
    const [, base64] = dataUrl.split(",");
    await openSnapvite(base64, "image/png");
  } catch (e) {
    console.error("[Snapvite] captureTab error:", e);
    await notifyError(
      "Couldn't screenshot this tab",
      e?.message?.includes("cannot be scripted")
        ? "Chrome blocks captures on this page."
        : "Please try again in a moment."
    );
  }
}

async function openSnapvite(base64, mediaType) {
  const token = crypto.randomUUID();
  const expiry = Date.now() + 5 * 60 * 1000;

  await chrome.storage.local.set({
    [`ext_${token}`]: { base64, mediaType, expiry },
  });

  // Best-effort cleanup of expired entries
  try {
    const items = await chrome.storage.local.get(null);
    const now = Date.now();
    const toDelete = Object.keys(items).filter(
      (k) => k.startsWith("ext_") && items[k]?.expiry && items[k].expiry < now
    );
    if (toDelete.length) await chrome.storage.local.remove(toDelete);
  } catch {
    /* non-fatal */
  }

  await chrome.tabs.create({ url: `${SNAPVITE_URL}/?ext=${token}` });
  await setBadge("✓", "#10b981");
  clearBadgeAfter(1500);
}
