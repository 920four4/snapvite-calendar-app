import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAnonymousLimiter, getFreeLimiter } from "@/lib/rate-limit";
import {
  PARSE_EVENT_SYSTEM_PROMPT,
  PARSE_EVENT_USER_TEMPLATE,
} from "@/lib/prompts/parse-event";
import type { EventDraft } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const EVENT_SCHEMA_KEYS: (keyof EventDraft)[] = [
  "is_event",
  "confidence",
  "title",
  "start",
  "end",
  "all_day",
  "location",
  "notes",
  "timezone",
  "ambiguities",
];

function validateEventDraft(obj: unknown): obj is EventDraft {
  if (typeof obj !== "object" || obj === null) return false;
  const ev = obj as Record<string, unknown>;
  for (const key of EVENT_SCHEMA_KEYS) {
    if (!(key in ev)) return false;
  }
  return true;
}

async function callClaude(
  imageBase64: string,
  mediaType: string,
  userMessage: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: PARSE_EVENT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          { type: "text", text: userMessage },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!user) {
      const { success } = await getAnonymousLimiter().limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Sign in for more parses.", reason: "rate_limited" },
          { status: 429 }
        );
      }
    } else {
      // Check plan
      const { data: settings } = await supabase
        .from("user_settings")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings?.plan !== "pro") {
        const { success } = await getFreeLimiter().limit(user.id);
        if (!success) {
          return NextResponse.json(
            { error: "Daily limit reached. Upgrade to Pro for unlimited parses.", reason: "rate_limited" },
            { status: 429 }
          );
        }
      }
    }

    // Parse body
    const body = await req.json();
    const { image, mediaType, userTimezone, currentDateISO } = body as {
      image: string;
      mediaType: string;
      userTimezone: string;
      currentDateISO: string;
    };

    if (!image || !mediaType || !userTimezone || !currentDateISO) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userMessage = PARSE_EVENT_USER_TEMPLATE(currentDateISO, userTimezone);

    // Call Claude
    let rawJson = await callClaude(image, mediaType, userMessage);

    // Strip any accidental markdown fences
    rawJson = rawJson.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Retry once
      const retry = await callClaude(
        image,
        mediaType,
        `${userMessage}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY the JSON object, no markdown, no code fences.`
      );
      const clean = retry.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      try {
        parsed = JSON.parse(clean);
      } catch {
        return NextResponse.json(
          { error: "Failed to parse event from image.", reason: "parse_failed" },
          { status: 422 }
        );
      }
    }

    if (!validateEventDraft(parsed)) {
      return NextResponse.json(
        { error: "Invalid event schema from model.", reason: "parse_failed" },
        { status: 422 }
      );
    }

    const event = parsed as EventDraft;

    if (!event.is_event) {
      return NextResponse.json(
        { error: "No event found in this image.", reason: "not_an_event" },
        { status: 422 }
      );
    }

    // Persist to history if authed
    if (user) {
      await supabase.from("event_history").insert({
        user_id: user.id,
        title: event.title,
        start_at: event.start,
        end_at: event.end,
        location: event.location || null,
        notes: event.notes || null,
        delivery_mode: null,
      });
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[/api/parse]", err);
    return NextResponse.json(
      { error: "Internal server error.", reason: "parse_failed" },
      { status: 500 }
    );
  }
}
