"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { generateIcs, buildGcalUrl } from "@/lib/ics";
import type { EventDraft, DeliveryMode } from "@/lib/types";

const AMBIGUITY_LABELS: Record<string, string> = {
  end_time_assumed: "End time was assumed (1 hour after start)",
  timezone_assumed: "Timezone was assumed from your device",
  title: "Title may be inaccurate",
  start: "Start time uncertain",
  end: "End time uncertain",
  location: "Location may be inaccurate",
};

function formatDatetimeLocal(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function parseDatetimeLocal(val: string, originalIso: string): string {
  if (!val) return originalIso;
  try {
    // Preserve original timezone offset
    const orig = new Date(originalIso);
    const offset = -orig.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
    const mm = String(Math.abs(offset) % 60).padStart(2, "0");
    return `${val}:00${sign}${hh}:${mm}`;
  } catch {
    return val;
  }
}

function isAmbiguous(field: string, ambiguities: string[]): boolean {
  return ambiguities.some((a) => a.toLowerCase().includes(field.toLowerCase()));
}

interface FieldProps {
  label: string;
  ambiguous: boolean;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, ambiguous, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold flex items-center gap-2">
        {label}
        {ambiguous && (
          <span
            className="text-xs font-normal px-1.5 py-0.5 rounded"
            style={{ background: "var(--highlight)", border: "1px solid var(--ink)" }}
            title={hint}
          >
            ⚠ review
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

export function ConfirmationCard({
  event,
  preview,
  heyEmail,
}: {
  event: EventDraft;
  preview: string;
  heyEmail?: string | null;
}) {
  const { updateEvent, setDelivering, setDone, setError, setIdle } = useAppStore();
  const [delivering, setDeliveringLocal] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [manualEmail, setManualEmail] = useState(heyEmail ?? "");
  const [emailError, setEmailError] = useState("");

  async function deliver(mode: DeliveryMode) {
    setDeliveringLocal(true);
    setDelivering(event, mode);

    if (mode === "gcal") {
      window.open(buildGcalUrl(event), "_blank");
      setDone(event, mode);
      return;
    }

    if (mode === "apple") {
      const ics = generateIcs(event);
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.slice(0, 40)}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(event, mode);
      return;
    }

    if (mode === "download") {
      const ics = generateIcs(event);
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.slice(0, 40)}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      // Telemetry call
      fetch("/api/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ics, mode, eventTitle: event.title }),
      });
      setDone(event, mode);
      return;
    }

    // hey_email
    if (!manualEmail) {
      setError("Please enter your HEY email address.");
      setDeliveringLocal(false);
      return;
    }
    const ics = generateIcs(event);
    const res = await fetch("/api/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ics,
        mode: "hey_email",
        recipientEmail: manualEmail,
        eventTitle: event.title,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      // Email failed — fall back gracefully: download the .ics so the user isn't stuck
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.slice(0, 40)}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      setEmailError(data.error ?? "Failed to send email.");
      setDeliveringLocal(false);
      return;
    }
    setDone(event, "hey_email");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Image thumbnail */}
      <div className="card overflow-hidden max-h-32 flex items-center justify-center bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Parsed screenshot" className="object-contain max-h-32 w-auto" />
      </div>

      {/* Confidence badge */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2 py-1 rounded"
          style={{
            background:
              event.confidence === "high"
                ? "var(--accent-2)"
                : event.confidence === "medium"
                ? "var(--highlight)"
                : "var(--accent)",
            border: "2px solid var(--ink)",
            color: event.confidence === "high" ? "var(--ink)" : "var(--ink)",
          }}
        >
          {event.confidence === "high"
            ? "✓ High confidence"
            : event.confidence === "medium"
            ? "⚠ Medium confidence — review highlighted fields"
            : "⚠ Low confidence — please review all fields"}
        </span>
      </div>

      {/* Editable form */}
      <div className="card p-5 flex flex-col gap-4">
        <Field
          label="Event title"
          ambiguous={isAmbiguous("title", event.ambiguities)}
          hint={AMBIGUITY_LABELS["title"]}
        >
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
            hint={AMBIGUITY_LABELS["start"]}
          >
            <input
              type="datetime-local"
              className={`input ${isAmbiguous("start", event.ambiguities) ? "ambiguous" : ""}`}
              value={formatDatetimeLocal(event.start)}
              onChange={(e) =>
                updateEvent({ start: parseDatetimeLocal(e.target.value, event.start) })
              }
            />
          </Field>

          <Field
            label="End"
            ambiguous={isAmbiguous("end", event.ambiguities)}
            hint={AMBIGUITY_LABELS["end"] ?? AMBIGUITY_LABELS["end_time_assumed"]}
          >
            <input
              type="datetime-local"
              className={`input ${isAmbiguous("end", event.ambiguities) ? "ambiguous" : ""}`}
              value={formatDatetimeLocal(event.end)}
              onChange={(e) =>
                updateEvent({ end: parseDatetimeLocal(e.target.value, event.end) })
              }
            />
          </Field>
        </div>

        <Field
          label="Location / URL"
          ambiguous={isAmbiguous("location", event.ambiguities)}
          hint={AMBIGUITY_LABELS["location"]}
        >
          <input
            className={`input ${isAmbiguous("location", event.ambiguities) ? "ambiguous" : ""}`}
            placeholder="Address, Zoom link, or empty"
            value={event.location}
            onChange={(e) => updateEvent({ location: e.target.value })}
          />
        </Field>

        <Field label="Notes" ambiguous={false}>
          <textarea
            className="input resize-y min-h-[80px]"
            placeholder="Description, agenda, or context"
            value={event.notes}
            onChange={(e) => updateEvent({ notes: e.target.value })}
          />
        </Field>

        {event.ambiguities.length > 0 && (
          <div
            className="text-sm p-3 rounded"
            style={{ background: "var(--highlight)", border: "2px solid var(--ink)" }}
          >
            <p className="font-semibold mb-1">Fields Claude had to guess:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {event.ambiguities.map((a) => (
                <li key={a} className="text-ink/80">
                  {AMBIGUITY_LABELS[a] ?? a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Delivery section */}
      <div className="card p-5 flex flex-col gap-4">
        <p className="font-bold text-base">Add to calendar</p>

        {/* HEY email delivery */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Your HEY address</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              placeholder="you@hey.com"
              value={manualEmail}
              onChange={(e) => { setManualEmail(e.target.value); setEmailError(""); }}
            />
            <button
              className="btn btn-primary whitespace-nowrap"
              disabled={delivering || !manualEmail}
              onClick={() => deliver("hey_email")}
              type="button"
            >
              📩 Email to HEY
            </button>
          </div>
          {emailError && (
            <div
              className="text-sm p-3 rounded flex gap-2 items-start"
              style={{ background: "var(--highlight)", border: "2px solid var(--ink)" }}
            >
              <span>⚠️</span>
              <div>
                <p className="font-semibold">Email failed — .ics downloaded instead</p>
                <p className="text-ink/70 mt-0.5">{emailError} Open the downloaded file to add to any calendar app.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--ink)", opacity: 0.15 }} />
          <span className="text-sm text-ink/40 font-medium">or</span>
          <div className="h-px flex-1" style={{ background: "var(--ink)", opacity: 0.15 }} />
        </div>

        {/* Other delivery */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="btn btn-secondary flex-1"
            disabled={delivering}
            onClick={() => deliver("download")}
            type="button"
          >
            ⬇ Download .ics
          </button>
          <button
            className="btn btn-secondary flex-1"
            disabled={delivering}
            onClick={() => deliver("gcal")}
            type="button"
          >
            📅 Google Cal
          </button>
          <button
            className="btn btn-secondary flex-1"
            disabled={delivering}
            onClick={() => deliver("apple")}
            type="button"
          >
            🍎 Apple Cal
          </button>
        </div>
      </div>

      {/* Start over */}
      <button
        className="btn btn-secondary w-full"
        onClick={() => setIdle()}
        type="button"
      >
        ← Start over
      </button>
    </div>
  );
}
