# Snapvite

> Screenshot any event, get it into your calendar in one tap. Built for HEY Calendar users first, works with any calendar second.

## What it does

Snapvite turns a screenshot of anything event-shaped — an iMessage from a friend, a Telegram group chat, a Luma invite, a booking confirmation — into a calendar event in seconds. It uses Claude Sonnet's vision capability to parse the image into structured event data, generates a standards-compliant `.ics` file, and delivers it to your calendar via your preferred method.

**Core loop:** Capture (paste / upload / share) → Parse (Claude vision) → Confirm (editable card) → Deliver (email-to-HEY, .ics download, or Google/Apple deep link)

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + hand-rolled neo-brutalist components |
| Auth | Supabase Auth (magic link only) |
| DB | Supabase Postgres |
| Vision model | `claude-sonnet-4-5` via Anthropic API |
| Email delivery | Resend |
| .ics generation | `ics` npm package (client-side) |
| Hosting | Vercel |
| Rate limiting | Upstash Redis |
| PWA | Manual manifest + service worker (no next-pwa) |

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in all values in `.env.local`:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis console |
| `NEXT_PUBLIC_APP_URL` | Your production URL |

### 3. Run the Supabase schema

Open your Supabase project → SQL Editor and run `supabase/schema.sql`.

### 4. Start the dev server

```bash
npm run dev
```

## Project structure

```
app/
  page.tsx              # Entry point (Suspense wrapper)
  HomeClient.tsx        # Main app UI (state machine)
  layout.tsx            # Root layout, fonts, PWA meta
  globals.css           # Neo-brutalist design tokens
  offline/page.tsx      # Offline fallback
  settings/
    page.tsx            # SSR-disabled wrapper
    SettingsClient.tsx  # Magic link auth + settings form
  api/
    parse/route.ts      # Claude vision → EventDraft
    deliver/route.ts    # Resend email delivery
    share/route.ts      # Web Share Target handler

components/
  CaptureZone.tsx       # Paste / drag-drop / file upload
  ConfirmationCard.tsx  # Editable event fields + delivery
  SuccessScreen.tsx     # Post-delivery confirmation
  ParseLoading.tsx      # Shimmer loading state
  ErrorCard.tsx         # Parse / delivery errors
  Header.tsx            # Top navigation
  ServiceWorkerRegistration.tsx

lib/
  types.ts              # EventDraft, AppState, UserSettings
  store.ts              # Zustand app state machine
  ics.ts                # .ics generation + GCal/Apple URLs
  deliver.ts            # Resend wrapper
  rate-limit.ts         # Upstash rate limiters
  supabase-server.ts    # Supabase SSR client
  supabase-client.ts    # Supabase browser client
  prompts/
    parse-event.ts      # Claude system prompt (version me!)

config/
  brand.ts              # All brand strings — rename here

supabase/
  schema.sql            # DB schema + RLS policies

public/
  manifest.json         # PWA manifest with share_target
  sw.js                 # Service worker
  icons/                # Replace with real icons before launch
```

## Key design decisions

**Prompt versioning:** `lib/prompts/parse-event.ts` is the most important file. Track changes with comments, iterate based on real failure cases. Target metric: ≥70% of parses need zero user edits.

**Never store the original image.** The parse route discards the base64 immediately after calling Claude. Only the structured `EventDraft` is persisted (opt-in, authenticated users only).

**Always show the confirmation card.** Even on high-confidence parses. Calendar mistakes are expensive. Ambiguous fields are highlighted in yellow until the user touches them.

**No Google auth.** Magic link only. The audience explicitly left Google.

**iOS honesty.** Web Share Target API doesn't work on iOS Safari. The UI tells users this explicitly — don't hide it.

## Deploy to Vercel

```bash
vercel --prod
```

Add all env vars in the Vercel dashboard before deploying.

## PWA icons

Replace the placeholder icons in `public/icons/` with real 192×192, 512×512, and 512×512 maskable PNGs before launch. The placeholders are 1×1 transparents.

## Rate limits

| Tier | Parses/day |
|---|---|
| Anonymous (by IP) | 3 |
| Free (authenticated) | 10 |
| Pro ($4/mo) | Unlimited |

## Phase 2 roadmap

- Native iOS share extension (Swift)
- Multi-event parsing (conference agendas)
- Recurring event detection
- OCR fallback for text-only input
- Browser extension
- Telegram bot
