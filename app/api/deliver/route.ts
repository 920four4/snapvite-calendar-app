import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { EmailNotConfiguredError, sendToHey } from "@/lib/deliver";
import type { DeliveryMode } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ics,
      mode,
      recipientEmail,
      eventTitle,
      userId,
    }: {
      ics: string;
      mode: DeliveryMode;
      recipientEmail?: string;
      eventTitle: string;
      userId?: string;
    } = body;

    if (!ics || !mode || !eventTitle) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // For download / gcal / apple — no-op, just record telemetry
    if (mode !== "hey_email") {
      if (userId) {
        const supabase = await createSupabaseServerClient();
        await supabase
          .from("event_history")
          .update({ delivery_mode: mode })
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
      }
      return NextResponse.json({ ok: true });
    }

    // HEY email delivery
    if (!recipientEmail) {
      return NextResponse.json(
        { ok: false, error: "Recipient email required for HEY delivery" },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await sendToHey({
        toEmail: recipientEmail,
        eventTitle,
        ics,
      });
    } catch (err) {
      if (err instanceof EmailNotConfiguredError) {
        return NextResponse.json(
          {
            ok: false,
            code: "email_not_configured",
            error: "Email sending isn't set up yet — downloading a .ics file instead.",
          },
          { status: 503 }
        );
      }
      throw err;
    }

    if (result.error) {
      console.error("[/api/deliver] Resend error:", result.error);
      const msg = String((result.error as { message?: string }).message ?? result.error);
      const lower = msg.toLowerCase();
      // Resend sandbox restriction — shouldn't normally happen now that we
      // require a verified RESEND_FROM_EMAIL, but catch it just in case.
      if (lower.includes("own email") || lower.includes("testing emails")) {
        return NextResponse.json(
          {
            ok: false,
            code: "sender_unverified",
            error: "This Snapvite deployment can't email that address yet — verify a sender domain in Resend.",
          },
          { status: 500 }
        );
      }
      if (lower.includes("invalid") && lower.includes("email")) {
        return NextResponse.json(
          { ok: false, code: "invalid_email", error: "That doesn't look like a valid email address." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { ok: false, code: "send_failed", error: "Couldn't send the email — try again or use .ics download." },
        { status: 502 }
      );
    }

    // Record delivery mode
    if (userId) {
      const supabase = await createSupabaseServerClient();
      await supabase
        .from("event_history")
        .update({ delivery_mode: mode })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/deliver]", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
