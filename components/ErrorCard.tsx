"use client";

import { useAppStore } from "@/lib/store";

export function ErrorCard({ message, preview }: { message: string; preview?: string }) {
  const { setIdle } = useAppStore();

  return (
    <div className="flex flex-col gap-4">
      {preview && (
        <div className="card overflow-hidden max-h-32 flex items-center justify-center bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Failed screenshot" className="object-contain max-h-32 w-auto" />
        </div>
      )}

      <div
        className="card p-6 flex flex-col gap-4"
        style={{ borderColor: "var(--accent)", boxShadow: "6px 6px 0 0 var(--accent)" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">⚠️</span>
          <div>
            <p className="font-bold text-lg mb-1">Couldn&apos;t parse this one</p>
            <p className="text-ink/70 text-sm">{message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-primary flex-1" onClick={() => setIdle()} type="button">
            Try another screenshot
          </button>
        </div>
      </div>
    </div>
  );
}
