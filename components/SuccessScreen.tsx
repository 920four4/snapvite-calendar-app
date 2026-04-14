"use client";

import { useAppStore } from "@/lib/store";
import type { DeliveryMode } from "@/lib/types";

const LABELS: Record<DeliveryMode, string> = {
  hey_email: "On its way to HEY",
  download: ".ics downloaded",
  gcal: "Opening Google Calendar",
  apple: "Opening Apple Calendar",
};

const HINTS: Record<DeliveryMode, string> = {
  hey_email: "Open the email and tap the attachment — HEY Calendar adds it automatically.",
  download: "Open the downloaded file to add it to any calendar app.",
  gcal: "The event details are pre-filled in Google Calendar.",
  apple: "The event details are pre-filled in Apple Calendar.",
};

export function SuccessScreen({ mode, eventTitle }: { mode: DeliveryMode; eventTitle: string }) {
  const { setIdle } = useAppStore();

  return (
    <div className="card p-8 flex flex-col items-center gap-5 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "#d1fae5" }}
      >
        ✅
      </div>

      <div>
        <p className="text-xl font-bold">{LABELS[mode]}</p>
        <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>{eventTitle}</span>
        </p>
      </div>

      <p className="text-sm max-w-xs" style={{ color: "var(--ink-2)" }}>
        {HINTS[mode]}
      </p>

      <button className="btn btn-primary px-6" onClick={() => setIdle()} type="button">
        Parse another →
      </button>
    </div>
  );
}
