import { createEvent, EventAttributes } from "ics";
import type { EventDraft } from "./types";

/**
 * Extract [year, month, day, hour, minute] in the event's IANA timezone so
 * the ICS carries DTSTART;TZID=<tz>:... rather than a UTC Z-suffix.
 */
function localComponents(
  iso: string,
  tz: string
): [number, number, number, number, number] {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  const h = get("hour") % 24; // hour12:false returns 24 for midnight
  return [get("year"), get("month"), get("day"), h, get("minute")];
}

function allDayComponents(iso: string): [number, number, number] {
  const d = new Date(iso);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

/**
 * ics v3 has no startTimezone/endTimezone props, so we generate floating
 * local times then inject TZID= into DTSTART/DTEND ourselves — RFC 5545 §3.3.5.
 */
function injectTzid(icsValue: string, tz: string): string {
  return icsValue
    .replace(/^DTSTART:/m, `DTSTART;TZID=${tz}:`)
    .replace(/^DTEND:/m, `DTEND;TZID=${tz}:`);
}

export function generateIcs(event: EventDraft): string {
  const tz = event.timezone || "UTC";

  const attrs: EventAttributes = {
    title: event.title,
    start: event.all_day
      ? allDayComponents(event.start)
      : localComponents(event.start, tz),
    startInputType: "local",
    startOutputType: "local",
    end: event.all_day
      ? allDayComponents(event.end)
      : localComponents(event.end, tz),
    endInputType: "local",
    endOutputType: "local",
    location: event.location || undefined,
    description: event.notes || undefined,
    productId: "snapvite/ics",
    uid: `${crypto.randomUUID()}@snapvite.app`,
  };

  const { value, error } = createEvent(attrs);
  if (error || !value) throw error ?? new Error("ICS generation failed");
  return event.all_day ? value : injectTzid(value, tz);
}

export function buildGcalUrl(event: EventDraft): string {
  const fmt = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(event.start)}/${fmt(event.end)}`,
    details: event.notes || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildAppleCalUrl(event: EventDraft): string {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    title: event.title,
    start: fmt(start),
    end: fmt(end),
    location: event.location || "",
    notes: event.notes || "",
  });
  return `webcal://p.bento.me/v1/new-event?${params}`;
}
