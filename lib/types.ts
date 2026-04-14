export interface EventDraft {
  is_event: boolean;
  confidence: "high" | "medium" | "low";
  title: string;
  start: string;
  end: string;
  all_day: boolean;
  location: string;
  notes: string;
  timezone: string;
  ambiguities: string[];
}

export type DeliveryMode = "hey_email" | "download" | "gcal" | "apple";

export type AppState =
  | { status: "idle" }
  | { status: "parsing"; preview: string }
  | { status: "confirming"; event: EventDraft; preview: string }
  | { status: "delivering"; event: EventDraft; mode: DeliveryMode }
  | { status: "done"; event: EventDraft; mode: DeliveryMode }
  | { status: "error"; message: string; preview?: string };

export interface UserSettings {
  user_id: string;
  hey_email: string | null;
  default_timezone: string;
  preferred_delivery: DeliveryMode;
  plan: "free" | "pro";
}
