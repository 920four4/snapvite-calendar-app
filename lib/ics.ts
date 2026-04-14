import { createEvent, EventAttributes } from "ics";
import type { EventDraft } from "./types";

/**
 * Extract [year, month, day, hour, minute] components in the event's own
 * timezone so the ICS file carries `DTSTART;TZID=<tz>:...` rather than a
 * UTC Z-suffix timestamp.  HEY Calendar (and every other app) then displays
 * the event in the attendee's local timezone correctly.
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
  // hour12:false can return 24 for midnight — normalise to 0
  const h = get("hour") % 24;
  return [get("year"), get("month"), get("day"), h, get("minute")];
}

function allDayComponents(iso: string): [number, number, number] {
  const d = new Date(iso);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

export function generateIcs(event: EventDraft): string {
  const tz = event.timezone || "UTC";

  const attrs: EventAttributes = {
    title: event.title,
    start: event.all_day
      ? allDayComponents(event.start)
      : localComponents(event.start, tz),
    startInputType: "local",
    ...(event.all_day ? {} : { startTimezone: tz }),
    end: event.all_day
      ? allDayComponents(event.end)
      : localComponents(event.end, tz),
    endInputType: "local",
    ...(event.all_day ? {} : { endTimezone: tz }),
    location: event.location || undefined,
    description: event.notes || undefined,
    productId: "snapvite/ics",
    uid: `${crypto.randomUUID()}@snapvite.app`,
  };

  const { value, error } = createEvent(attrs);
  if (error || !value) throw error ?? new Error("ICS generation failed");
  return value;
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
  // Apple Calendar deep link
  return `webcal://p.bento.me/v1/new-event?${params}`;
}
