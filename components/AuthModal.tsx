"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!email) return;
    setLoading(true);
    setError("");
    const supabase = createSupabaseClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 flex flex-col gap-5">
        {!sent ? (
          <>
            <div>
              <h2 className="text-lg font-bold">Sign in to Snapvite</h2>
              <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                We&apos;ll email you a magic link — no password needed.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              {error && (
                <p className="text-xs" style={{ color: "var(--accent)" }}>{error}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-primary flex-1"
                onClick={send}
                disabled={loading || !email}
                type="button"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
              <button className="btn btn-ghost" onClick={onClose} type="button">
                Cancel
              </button>
            </div>

            <p className="text-xs text-center" style={{ color: "var(--ink-3)" }}>
              Signing in gives you 10 parses/day and saves your HEY address.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "#d1fae5" }}>
                ✉️
              </div>
              <div>
                <p className="font-bold text-base">Check your inbox</p>
                <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                  We sent a magic link to <strong>{email}</strong>.
                  <br />Click it to sign in — the link expires in 1 hour.
                </p>
              </div>
            </div>
            <button className="btn btn-surface w-full" onClick={onClose} type="button">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
