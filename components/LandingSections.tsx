"use client";

const SOURCES = [
  { name: "iMessage", icon: "💬" },
  { name: "Telegram", icon: "✈️" },
  { name: "WhatsApp", icon: "💚" },
  { name: "Luma", icon: "🎟" },
  { name: "Partiful", icon: "🎉" },
  { name: "Airbnb", icon: "🏡" },
  { name: "Booking.com", icon: "🛏" },
  { name: "Eventbrite", icon: "🎫" },
  { name: "Gmail", icon: "✉️" },
  { name: "Slack", icon: "💼" },
  { name: "Notion", icon: "📝" },
  { name: "Discord", icon: "🗣" },
];

const STEPS = [
  {
    n: "01",
    title: "Screenshot the event",
    body: "Anywhere — a chat, a booking email, a poster, a Luma page. ⌘-Shift-4 still works everywhere else.",
  },
  {
    n: "02",
    title: "Paste or drop into Snapvite",
    body: "Or click the Chrome extension to capture the current tab. Claude reads the image and extracts title, time, location.",
  },
  {
    n: "03",
    title: "Add to your calendar",
    body: "HEY email, Google, Apple, or a plain .ics file. Review and tweak the details first — you're always in control.",
  },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "About as fast as copy-paste",
    body: "Parse in a couple of seconds. No typing event details by hand, no fighting with AM/PM and timezones.",
  },
  {
    icon: "🔒",
    title: "Screenshots never stored",
    body: "The image hits our API once for parsing, then disappears. Only the parsed event is saved to your history.",
  },
  {
    icon: "📆",
    title: "Works with every calendar",
    body: "HEY Calendar first-class. Google and Apple via one-click deep links. Everything else via .ics download.",
  },
  {
    icon: "🧠",
    title: "Claude vision, not OCR",
    body: "Understands context — a “tomorrow 7pm” in a chat becomes a real date, in your timezone, with the right year.",
  },
  {
    icon: "🖱",
    title: "One-click browser extension",
    body: "Click the Snapvite icon to screenshot the current tab. Or right-click any image to send it straight through.",
  },
  {
    icon: "📱",
    title: "Installable PWA",
    body: "Add Snapvite to your iOS home screen. Share screenshots straight to it from the iOS share sheet.",
  },
];

const FAQ = [
  {
    q: "Is my screenshot stored anywhere?",
    a: "No. Images are sent to our API once for parsing by Claude vision and are immediately discarded. Only the parsed event fields (title, time, location, notes) are kept — and only if you're signed in and want a history.",
  },
  {
    q: "How accurate is the parse?",
    a: "Very good on clear screenshots with a visible date/time. When Claude isn't sure about a field, Snapvite flags it as “Review” so you can fix it in one click before saving.",
  },
  {
    q: "What does HEY Calendar delivery actually do?",
    a: "Snapvite emails a calendar invite (.ics) to your HEY address with the event as an attachment. Opening the email in HEY adds the event to your calendar — no copy-paste, no redirects.",
  },
  {
    q: "Why is there a sign-in at all?",
    a: "You don't need one — the core flow works anonymously. Signing in gives you a parse history, remembers your HEY email, and raises your rate limit.",
  },
  {
    q: "Does it work on iPhone?",
    a: "Yes. Install it to the home screen (Share → Add to Home Screen) and you can share screenshots from any app straight into Snapvite.",
  },
];

export function LandingSections() {
  return (
    <section className="w-full max-w-5xl mx-auto mt-20 md:mt-28 px-4 flex flex-col gap-20 md:gap-28">
      {/* Works with anything — marquee */}
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <p className="section-eyebrow">Works with</p>
          <h2 className="section-title mt-2">Every place you get invited to things</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
            If you can screenshot it, Snapvite can read it.
          </p>
        </div>

        <div className="marquee-wrap">
          <div className="marquee-row">
            {[...SOURCES, ...SOURCES].map((s, i) => (
              <span key={`${s.name}-${i}`} className="source-tile">
                <span aria-hidden="true">{s.icon}</span>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="flex flex-col gap-8 scroll-mt-20">
        <div className="text-center">
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-title mt-2">Three steps. No typing.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="step-number">{step.n}</span>
                <h3 className="font-semibold text-base leading-tight">{step.title}</h3>
              </div>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Snapvite — feature grid */}
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <p className="section-eyebrow">Why Snapvite</p>
          <h2 className="section-title mt-2">Tiny tool, big time saver</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-tile">
              <span className="icon" aria-hidden="true">{f.icon}</span>
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chrome extension CTA */}
      <div
        className="card p-6 md:p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #fff 0%, #fffaf3 65%, rgba(255,94,91,0.08) 100%)",
        }}
      >
        <div className="relative flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <span className="chip chip-accent self-start">
              <span>🧩</span> Chrome extension
            </span>
            <h3 className="section-title">One click, straight from the page you&apos;re on.</h3>
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>
              Click the Snapvite icon to screenshot the tab. Right-click any image to
              send it through. No copying files, no juggling windows.
            </p>
          </div>

          <div className="flex gap-2 md:flex-col md:items-end">
            <a
              className="btn btn-ink"
              href="https://github.com/920four4/snapvite-calendar-app/tree/main/chrome-extension"
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">⬇</span> Install the extension
            </a>
            <span className="text-xs" style={{ color: "var(--ink-3)" }}>
              Manifest v3 · free · open source
            </span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <div className="text-center mb-2">
          <p className="section-eyebrow">FAQ</p>
          <h2 className="section-title mt-2">Questions people ask first</h2>
        </div>

        <div>
          {FAQ.map((item) => (
            <details key={item.q} className="faq">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
