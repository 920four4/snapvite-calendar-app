import { createEvent, EventAttributes } from "ics";
import type { EventDraft } from "./types";

export function generateIcs(event: EventDraft): string {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const attrs: EventAttributes = {
    title: event.title,
    start: event.all_day
      ? [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()]
      : [
          start.getUTCFullYear(),
          start.getUTCMonth() + 1,
          start.getUTCDate(),
          start.getUTCHours(),
          start.getUTCMinutes(),
        ],
    startInputType: "utc",
    end: event.all_day
      ? [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()]
      : [
          end.getUTCFullYear(),
          end.getUTCMonth() + 1,
          end.getUTCDate(),
          end.getUTCHours(),
          end.getUTCMinutes(),
        ],
    endInputType: "utc",
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
