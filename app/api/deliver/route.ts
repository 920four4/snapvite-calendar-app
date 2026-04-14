import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendToHey } from "@/lib/deliver";
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

    const result = await sendToHey({
      toEmail: recipientEmail,
      eventTitle,
      ics,
    });

    if (result.error) {
      console.error("[/api/deliver] Resend error:", result.error);
      return NextResponse.json(
        { ok: false, error: "Failed to send email." },
        { status: 500 }
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
