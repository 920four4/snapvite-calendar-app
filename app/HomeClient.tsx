"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { CaptureZone } from "@/components/CaptureZone";
import { ParseLoading } from "@/components/ParseLoading";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { SuccessScreen } from "@/components/SuccessScreen";
import { ErrorCard } from "@/components/ErrorCard";
import { Header } from "@/components/Header";
import { brand } from "@/config/brand";

export default function HomeClient() {
  const { state, setParsing, setConfirming, setError } = useAppStore();
  const searchParams = useSearchParams();

  // Handle Web Share Target redirect: /?shared=<token>
  useEffect(() => {
    const token = searchParams.get("shared");
    if (!token) return;

    // Clear the URL param without adding a history entry
    window.history.replaceState({}, "", "/");

    (async () => {
      const res = await fetch(`/api/share?token=${token}`);
      if (!res.ok) {
        setError("Shared image expired or not found. Please try again.");
        return;
      }
      const { data, mediaType } = await res.json();
      const preview = `data:${mediaType};base64,${data}`;
      setParsing(preview);

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentDateISO = new Date().toISOString();

      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data, mediaType, userTimezone, currentDateISO }),
      });
      const parsed = await parseRes.json();

      if (!parseRes.ok || parsed.error) {
        setError(parsed.error ?? "Could not parse the shared image.", preview);
        return;
      }
      setConfirming(parsed.event, preview);
    })();
  }, [searchParams, setParsing, setConfirming, setError]);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl flex flex-col gap-6">

          {/* Landing hero — only show when idle */}
          {state.status === "idle" && (
            <div className="flex flex-col gap-4">
              <div className="card p-6 flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight leading-tight">
                  Screenshot any event.
                  <br />
                  <span style={{ color: "var(--accent)" }}>Get it into your calendar</span>{" "}
                  in one tap.
                </h1>
                <p className="text-ink/60 text-base">
                  Built for HEY Calendar users. Works with any calendar.
                </p>
              </div>

              <CaptureZone />

              <div
                className="text-sm p-3 rounded flex gap-2 items-start"
                style={{ background: "var(--muted)", border: "2px solid var(--ink)" }}
              >
                <span>🔒</span>
                <p className="text-ink/70">
                  <strong>Privacy first.</strong> Your screenshots are never stored. We parse
                  and immediately discard the image — only the event data is saved.
                </p>
              </div>

              {/* iOS caveat — transparent and honest */}
              <div
                className="text-sm p-3 rounded flex gap-2 items-start"
                style={{ background: "var(--highlight)", border: "2px solid var(--ink)" }}
              >
                <span>📱</span>
                <p className="text-ink/70">
                  <strong>iOS users:</strong> paste or upload a screenshot in Safari. The
                  one-tap share-sheet flow requires a native app — coming in Phase 2.
                </p>
              </div>
            </div>
          )}

          {state.status === "parsing" && <ParseLoading preview={state.preview} />}

          {state.status === "confirming" && (
            <ConfirmationCard event={state.event} preview={state.preview} />
          )}

          {state.status === "delivering" && (
            <div className="card p-8 flex flex-col items-center gap-4">
              <span className="text-4xl animate-spin" aria-hidden="true">⚙️</span>
              <p className="font-bold text-lg">Delivering…</p>
            </div>
          )}

          {state.status === "done" && (
            <SuccessScreen mode={state.mode} eventTitle={state.event.title} />
          )}

          {state.status === "error" && (
            <ErrorCard message={state.message} preview={state.preview} />
          )}
        </div>
      </main>

      <footer
        className="text-center text-xs text-ink/40 py-4 px-4"
        style={{ borderTop: "var(--border)" }}
      >
        <p>
          {brand.name} — {brand.tagline}
        </p>
      </footer>
    </div>
  );
}
