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
    <div className="card p-8 flex flex-col items-center gap-5 text-center fade-up">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{
          background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          boxShadow: "inset 0 0 0 1px rgba(6,95,70,0.12)",
        }}
      >
        ✓
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xl font-bold tracking-tight">{LABELS[mode]}</p>
        <p className="text-sm" style={{ color: "var(--ink-2)" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            {eventTitle}
          </span>
        </p>
      </div>

      <p className="text-sm max-w-xs" style={{ color: "var(--ink-2)" }}>
        {HINTS[mode]}
      </p>

      <div className="flex gap-2 pt-1">
        <button className="btn btn-primary px-5" onClick={() => setIdle()} type="button">
          Parse another →
        </button>
      </div>
    </div>
  );
}
