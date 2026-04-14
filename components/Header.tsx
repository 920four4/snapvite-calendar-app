"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { useAppStore } from "@/lib/store";
import { AuthModal } from "./AuthModal";
import { createSupabaseClient } from "@/lib/supabase-client";

export function Header({ userEmail }: { userEmail?: string | null }) {
  const { setIdle } = useAppStore();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function signOut() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <>
      <header
        className="flex items-center justify-between px-5 py-3.5"
        style={{
          background: "rgba(255,253,247,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => setIdle()}
          className="flex items-center gap-2 font-bold text-base tracking-tight hover:opacity-75 transition-opacity"
          style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font)", fontWeight: 700 }}
          type="button"
        >
          <span className="text-lg">📸</span>
          <span>{brand.name}</span>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          {userEmail ? (
            <div className="relative" ref={menuRef}>
              <button
                className="btn btn-surface text-sm py-1.5 px-3 flex items-center gap-2"
                onClick={() => setShowMenu((v) => !v)}
                type="button"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "var(--accent)", fontSize: "10px" }}
                >
                  {userEmail[0].toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate hidden sm:block" style={{ color: "var(--ink-2)" }}>
                  {userEmail}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--ink-3)" }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 mt-1.5 w-48 card-flat py-1 z-50"
                  style={{ boxShadow: "var(--shadow)" }}
                >
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--bg)] transition-colors"
                    style={{ color: "var(--ink)" }}
                    onClick={() => setShowMenu(false)}
                  >
                    <span>⚙️</span> Settings
                  </Link>
                  <div className="divider my-1" />
                  <button
                    className="flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left hover:bg-[var(--bg)] transition-colors"
                    style={{ color: "var(--ink-2)" }}
                    onClick={signOut}
                    type="button"
                  >
                    <span>→</span> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-surface text-sm py-1.5 px-3"
              onClick={() => setShowAuth(true)}
              type="button"
            >
              Sign in
            </button>
          )}
        </nav>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
