"use client";

import { useAppStore } from "@/lib/store";
import type { DeliveryMode } from "@/lib/types";

const DELIVERY_LABELS: Record<DeliveryMode, string> = {
  hey_email: "Sent to HEY Calendar",
  download: ".ics downloaded",
  gcal: "Opening Google Calendar",
  apple: "Opening Apple Calendar",
};

const DELIVERY_ICONS: Record<DeliveryMode, string> = {
  hey_email: "📩",
  download: "⬇",
  gcal: "📅",
  apple: "🍎",
};

export function SuccessScreen({
  mode,
  eventTitle,
}: {
  mode: DeliveryMode;
  eventTitle: string;
}) {
  const { setIdle } = useAppStore();

  return (
    <div className="card p-8 flex flex-col items-center gap-6 text-center">
      <div className="text-6xl" aria-hidden="true">✅</div>

      <div>
        <p className="text-3xl font-bold mb-2">{DELIVERY_ICONS[mode]} {DELIVERY_LABELS[mode]}</p>
        <p className="text-ink/60 text-base">
          <span className="font-semibold text-ink">{eventTitle}</span> is in your calendar.
        </p>
      </div>

      {mode === "hey_email" && (
        <div
          className="text-sm p-3 rounded w-full text-left"
          style={{ background: "var(--accent-2)", border: "2px solid var(--ink)" }}
        >
          <p className="font-semibold">Check your HEY inbox.</p>
          <p className="mt-0.5 text-ink/80">
            Open the email and tap the .ics attachment — HEY Calendar will add it automatically.
          </p>
        </div>
      )}

      <button
        className="btn btn-primary text-lg px-8 py-3"
        onClick={() => setIdle()}
        type="button"
      >
        Do another →
      </button>
    </div>
  );
}
