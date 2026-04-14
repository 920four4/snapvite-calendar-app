# Snapvite Chrome Extension

One-click screenshot → calendar event.

## Install (developer mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder
5. The Snapvite icon appears in your toolbar — pin it for quick access

## How to use

### Option 1 — Capture this tab
Click the Snapvite icon in the toolbar → **"Capture this tab"**
The extension screenshots the visible page and opens Snapvite with it pre-loaded.

### Option 2 — Right-click any image
On any webpage, right-click an image and choose:
**"📅 Add to calendar with Snapvite"**

The extension fetches that image, opens Snapvite, and auto-starts the parse flow.

## How it works

1. Extension captures the image (tab screenshot or in-page image)
2. Stores it temporarily in `chrome.storage.local` (5 min TTL)
3. Opens `snapvite-calendar-app.vercel.app/?ext=<token>`
4. A content script reads the token, retrieves the image, and posts it to the page
5. The Snapvite app receives it and starts the Claude vision parse

No images are ever sent to any extension server — they go directly from your browser to the Snapvite API.

## Icons

Replace the placeholder icons in `icons/` before publishing to the Chrome Web Store:
- `icon-16.png` — 16×16
- `icon-32.png` — 32×32  
- `icon-48.png` — 48×48
- `icon-128.png` — 128×128

## Update the target URL

If you self-host Snapvite, update `SNAPVITE_URL` in `background.js` and `matches` in `manifest.json`.
