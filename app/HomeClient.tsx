"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase-client";
import { CaptureZone } from "@/components/CaptureZone";
import { ParseLoading } from "@/components/ParseLoading";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { SuccessScreen } from "@/components/SuccessScreen";
import { ErrorCard } from "@/components/ErrorCard";
import { Header } from "@/components/Header";
import { LandingSections } from "@/components/LandingSections";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomeClient({ emailEnabled = false }: { emailEnabled?: boolean }) {
  const { state, setParsing, setConfirming, setError, setIdle } = useAppStore();
  const searchParams = useSearchParams();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [heyEmail, setHeyEmail] = useState<string | null>(null);

  // Load auth state
  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
        supabase
          .from("user_settings")
          .select("hey_email")
          .eq("user_id", data.user.id)
          .maybeSingle()
          .then(({ data: s }) => { if (s?.hey_email) setHeyEmail(s.hey_email); });
      }
    });

    // Listen for auth state changes (magic link sign-in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) setUserEmail(session.user.email);
      else setUserEmail(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle Web Share Target redirect: /?shared=<token>
  useEffect(() => {
    const token = searchParams.get("shared");
    if (!token) return;
    window.history.replaceState({}, "", "/");
    fetchAndParse(`/api/share?token=${token}`, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle Chrome Extension handoff: /?ext=<token>.
  // The content script retries every 150ms until we ACK, so mounting order
  // doesn't matter — but we also announce READY right away to short-circuit
  // the retry loop when the page wins the race.
  useEffect(() => {
    const extToken = searchParams.get("ext");
    if (!extToken) return;
    window.history.replaceState({}, "", "/");

    let handled = false;
    function handleExtMessage(e: MessageEvent) {
      if (e.source !== window) return;
      if (e.data?.type !== "SNAPVITE_EXT_IMAGE" || handled) return;
      handled = true;
      window.postMessage({ type: "SNAPVITE_EXT_ACK" }, window.location.origin);
      window.removeEventListener("message", handleExtMessage);
      const { base64, mediaType } = e.data;
      const preview = `data:${mediaType};base64,${base64}`;
      setParsing(preview);
      callParse(base64, mediaType, preview);
    }
    window.addEventListener("message", handleExtMessage);
    // Tell the content script we're ready — works even if we mounted last.
    window.postMessage({ type: "SNAPVITE_EXT_READY" }, window.location.origin);

    // If nothing arrives in 10s, surface an error instead of hanging forever.
    const timeoutId = setTimeout(() => {
      if (handled) return;
      window.removeEventListener("message", handleExtMessage);
      setError("Couldn't receive the screenshot from the extension. Try capturing again.");
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("message", handleExtMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function fetchAndParse(shareUrl: string, isShare: boolean) {
    const res = await fetch(shareUrl);
    if (!res.ok) { setError("Shared image expired or not found."); return; }
    const { data, mediaType } = await res.json();
    const preview = `data:${mediaType};base64,${data}`;
    setParsing(preview);
    await callParse(data, mediaType, preview);
  }

  async function callParse(base64: string, mediaType: string, preview: string) {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentDateISO = new Date().toISOString();
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mediaType, userTimezone, currentDateISO }),
    });
    const parsed = await res.json();
    if (!res.ok || parsed.error) {
      setError(parsed.error ?? "Could not parse the image.", preview);
      return;
    }
    setConfirming(parsed.event, preview);
  }

  const isIdle = state.status === "idle";

  return (
    <div className="min-h-dvh flex flex-col">
      <Header userEmail={userEmail} />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero / capture */}
        <section className="w-full flex flex-col items-center px-4 pt-10 md:pt-16 pb-6 md:pb-10">
          <div className="w-full max-w-xl flex flex-col gap-5">
            {isIdle && (
              <div className="text-center flex flex-col items-center gap-4 fade-up">
                <span className="chip chip-accent">
                  <span aria-hidden="true">✨</span> Screenshot → calendar in ~3 seconds
                </span>
                <h1 className="hero-title">
                  Turn any screenshot into a <span className="accent">calendar event</span>.
                </h1>
                <p className="hero-sub max-w-md">
                  Paste a chat, a booking email, a Luma page — Snapvite reads it,
                  pulls out the details, and hands you a calendar invite.
                </p>
              </div>
            )}

            {isIdle && (
              <div className="fade-up" style={{ animationDelay: "80ms" }}>
                <CaptureZone />
              </div>
            )}

            {isIdle && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ink-3)" }}>
                <span>🔒 Screenshots never stored</span>
                <span aria-hidden="true">·</span>
                <span>⚡ Parsed in ~3s by Claude</span>
                <span aria-hidden="true">·</span>
                <span>🆓 Free to try</span>
              </div>
            )}

            {state.status === "parsing" && <ParseLoading preview={state.preview} />}

            {state.status === "confirming" && (
              <ConfirmationCard
                event={state.event}
                preview={state.preview}
                heyEmail={heyEmail}
                emailEnabled={emailEnabled}
              />
            )}

            {state.status === "delivering" && (
              <div className="card p-8 flex flex-col items-center gap-4">
                <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
                <p className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>Delivering…</p>
              </div>
            )}

            {state.status === "done" && (
              <SuccessScreen mode={state.mode} eventTitle={state.event.title} />
            )}

            {state.status === "error" && (
              <ErrorCard message={state.message} preview={state.preview} />
            )}
          </div>
        </section>

        {/* Landing marketing — only on idle so it doesn't clutter the flow */}
        {isIdle && <LandingSections />}
      </main>

      <SiteFooter />
    </div>
  );
}
