# Snapvite Chrome Extension

One-click screenshot → calendar event.

## Install (developer mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder
5. The Snapvite icon appears in your toolbar — pin it for quick access

## How to use

### Option 1 — One-click tab capture
Click the Snapvite icon in the toolbar. The current tab is screenshotted and
Snapvite opens with it pre-loaded. No popup, no second click.

### Option 2 — Right-click any image
On any webpage, right-click an image and choose
**"📅 Add to calendar with Snapvite"**.

### Option 3 — Right-click anywhere on a page
Right-click and choose **"📅 Screenshot this page → Snapvite"** to capture the
whole tab from the context menu.

## How it works

1. Extension captures the image (tab screenshot or in-page image).
2. The image is stashed in `chrome.storage.local` against a random token
   with a 5-minute TTL.
3. A new tab opens at `snapvite-calendar-app.vercel.app/?ext=<token>`.
4. A content script on that page retrieves the image and posts it to the
   app with a retry/ACK handshake so it cannot be lost to a timing race.
5. Snapvite receives it and starts the Claude vision parse.

No images are ever sent to any extension server — they go directly from your
browser to the Snapvite API.

## Status feedback

- Toolbar badge shows `…` during capture, `✓` on success, `!` on error.
- On capture failure you'll get a Chrome notification explaining why
  (e.g. "Chrome blocks captures on this page" for `chrome://` URLs).

## Icons

Replace the placeholder icons in `icons/` before publishing to the Chrome Web Store:
- `icon-16.png` — 16×16
- `icon-32.png` — 32×32
- `icon-48.png` — 48×48
- `icon-128.png` — 128×128

## Self-hosting

If you self-host Snapvite, update `SNAPVITE_URL` in `background.js` and the
`matches` + `host_permissions` entries in `manifest.json`.
