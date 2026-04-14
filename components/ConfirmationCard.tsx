"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { generateIcs, buildGcalUrl } from "@/lib/ics";
import type { EventDraft, DeliveryMode } from "@/lib/types";

function formatDatetimeLocal(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

function parseDatetimeLocal(val: string, originalIso: string): string {
  if (!val) return originalIso;
  try {
    const orig = new Date(originalIso);
    const offset = -orig.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
    const mm = String(Math.abs(offset) % 60).padStart(2, "0");
    return `${val}:00${sign}${hh}:${mm}`;
  } catch { return val; }
}

function isAmbiguous(field: string, ambiguities: string[]) {
  return ambiguities.some((a) => a.toLowerCase().includes(field.toLowerCase()));
}

const AMBIGUITY_HINTS: Record<string, string> = {
  end_time_assumed: "End time assumed (1 hr after start)",
  timezone_assumed: "Timezone assumed from your device",
  start: "Start time uncertain — please verify",
  end: "End time uncertain — please verify",
  title: "Title may be inaccurate",
  location: "Location may be inaccurate",
};

function Field({
  label, ambiguous, hint, children,
}: {
  label: string; ambiguous: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--ink-3)" }}>
        {label}
        {ambiguous && (
          <span className="badge badge-yellow normal-case tracking-normal font-medium text-xs">
            Review
          </span>
        )}
      </label>
      {children}
      {ambiguous && hint && (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>{hint}</p>
      )}
    </div>
  );
}

export function ConfirmationCard({
  event, preview, heyEmail,
}: {
  event: EventDraft; preview: string; heyEmail?: string | null;
}) {
  const { updateEvent, setDone, setIdle } = useAppStore();
  const [delivering, setDeliveringLocal] = useState(false);
  const [manualEmail, setManualEmail] = useState(heyEmail ?? "");
  const [emailError, setEmailError] = useState("");

  async function deliver(mode: DeliveryMode) {
    setDeliveringLocal(true);
    setEmailError("");

    // gcal / apple / download — instant client-side, no network wait needed
    if (mode === "gcal") {
      window.open(buildGcalUrl(event), "_blank");
      setDone(event, mode);
      return;
    }

    if (mode === "apple" || mode === "download") {
      const ics = generateIcs(event);
      triggerDownload(ics, event.title);
      // Fire-and-forget telemetry — never await, never block UI
      fetch("/api/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ics, mode, eventTitle: event.title }),
      }).catch(() => {});
      setDone(event, mode);
      return;
    }

    // hey_email — keep the card visible with a local spinner; only transition
    // to "done" on success so the app can never get stuck on "Delivering…"
    if (!manualEmail) {
      setEmailError("Enter your HEY email address first.");
      setDeliveringLocal(false);
      return;
    }
    const ics = generateIcs(event);
    try {
      const res = await fetch("/api/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ics, mode: "hey_email", recipientEmail: manualEmail, eventTitle: event.title }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Email failed");
      setDone(event, "hey_email");
    } catch (err: unknown) {
      // Silently fall back to downloading the .ics so the user isn't left empty-handed
      triggerDownload(ics, event.title);
      const msg = err instanceof Error ? err.message : "Email failed";
      setEmailError(msg + " — .ics downloaded instead.");
      setDeliveringLocal(false);
    }
  }

  function triggerDownload(ics: string, title: string) {
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 40)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const confidenceBadge = {
    high: <span className="badge badge-green">High confidence</span>,
    medium: <span className="badge badge-yellow">Medium confidence</span>,
    low: <span className="badge badge-red">Low confidence — review all fields</span>,
  }[event.confidence];

  return (
    <div className="flex flex-col gap-3">
      {/* Screenshot thumbnail */}
      <div
        className="card-flat overflow-hidden flex items-center justify-center"
        style={{ maxHeight: "110px", background: "var(--bg)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="object-contain max-h-[110px] w-auto" />
      </div>

      {/* Event details form */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-base">Event details</p>
          {confidenceBadge}
        </div>

        <div className="divider" />

        <Field label="Title" ambiguous={isAmbiguous("title", event.ambiguities)}>
          <input
            className={`input ${isAmbiguous("title", event.ambiguities) ? "ambiguous" : ""}`}
            value={event.title}
            onChange={(e) => updateEvent({ title: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Start"
            ambiguous={isAmbiguous("start", event.ambiguities)}
            hint={AMBIGUITY_HINTS["start"]}
          >
            <input
              type="datetime-local"
              className={`input ${isAmbiguous("start", event.ambiguities) ? "ambiguous" : ""}`}
              value={formatDatetimeLocal(event.start)}
              onChange={(e) => updateEvent({ start: parseDatetimeLocal(e.target.value, event.start) })}
            />
          </Field>
          <Field
            label="End"
            ambiguous={isAmbiguous("end", event.ambiguities)}
            hint={AMBIGUITY_HINTS["end_time_assumed"]}
          >
            <input
              type="datetime-local"
              className={`input ${isAmbiguous("end", event.ambiguities) ? "ambiguous" : ""}`}
              value={formatDatetimeLocal(event.end)}
              onChange={(e) => updateEvent({ end: parseDatetimeLocal(e.target.value, event.end) })}
            />
          </Field>
        </div>

        <Field label="Location / URL" ambiguous={isAmbiguous("location", event.ambiguities)}>
          <input
            className={`input ${isAmbiguous("location", event.ambiguities) ? "ambiguous" : ""}`}
            placeholder="Address, Zoom link, or leave empty"
            value={event.location}
            onChange={(e) => updateEvent({ location: e.target.value })}
          />
        </Field>

        <Field label="Notes" ambiguous={false}>
          <textarea
            className="input resize-y"
            style={{ minHeight: "72px" }}
            placeholder="Description or context"
            value={event.notes}
            onChange={(e) => updateEvent({ notes: e.target.value })}
          />
        </Field>
      </div>

      {/* Delivery */}
      <div className="card p-5 flex flex-col gap-4">
        <p className="font-semibold text-base">Add to calendar</p>
        <div className="divider" />

        {/* HEY email */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            HEY Calendar
          </label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              placeholder="you@hey.com"
              value={manualEmail}
              onChange={(e) => { setManualEmail(e.target.value); setEmailError(""); }}
            />
            <button
              className="btn btn-primary flex-shrink-0"
              disabled={delivering || !manualEmail}
              onClick={() => deliver("hey_email")}
              type="button"
            >
              {delivering
                ? <span className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)", width: "16px", height: "16px", borderWidth: "2px" }} />
                : "Send"}
            </button>
          </div>
          {emailError && (
            <p className="text-xs" style={{ color: "var(--accent)" }}>{emailError}</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="divider flex-1" />
          <span className="text-xs font-medium" style={{ color: "var(--ink-3)" }}>or</span>
          <div className="divider flex-1" />
        </div>

        {/* Other options */}
        <div className="grid grid-cols-3 gap-2">
          <button className="btn btn-surface text-sm flex-col py-3 h-auto gap-1" disabled={delivering} onClick={() => deliver("download")} type="button">
            <span>⬇</span>
            <span className="text-xs">.ics file</span>
          </button>
          <button className="btn btn-surface text-sm flex-col py-3 h-auto gap-1" disabled={delivering} onClick={() => deliver("gcal")} type="button">
            <span>📅</span>
            <span className="text-xs">Google</span>
          </button>
          <button className="btn btn-surface text-sm flex-col py-3 h-auto gap-1" disabled={delivering} onClick={() => deliver("apple")} type="button">
            <span>🍎</span>
            <span className="text-xs">Apple</span>
          </button>
        </div>
      </div>

      <button className="btn btn-ghost w-full text-sm" onClick={() => setIdle()} type="button">
        ← Start over
      </button>
    </div>
  );
}
