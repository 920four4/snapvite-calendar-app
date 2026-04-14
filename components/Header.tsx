"use client";

import Link from "next/link";
import { brand } from "@/config/brand";
import { useAppStore } from "@/lib/store";

export function Header({ userEmail }: { userEmail?: string | null }) {
  const { setIdle } = useAppStore();

  return (
    <header
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-50"
      style={{
        background: "var(--bg)",
        borderBottom: "var(--border)",
        boxShadow: "0 3px 0 0 var(--ink)",
      }}
    >
      <button
        onClick={() => setIdle()}
        className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        style={{ all: "unset", cursor: "pointer" }}
        type="button"
        aria-label="Go home"
      >
        <span>📸</span>
        <span>{brand.name}</span>
      </button>

      <nav className="flex items-center gap-2">
        {userEmail ? (
          <>
            <Link href="/settings" className="btn btn-secondary text-sm py-1.5 px-3">
              ⚙ Settings
            </Link>
          </>
        ) : (
          <Link href="/settings" className="btn btn-ink text-sm py-1.5 px-3">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
