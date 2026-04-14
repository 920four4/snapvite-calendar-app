"use client";

import { useAppStore } from "@/lib/store";

export function ErrorCard({ message, preview }: { message: string; preview?: string }) {
  const { setIdle } = useAppStore();

  return (
    <div className="card p-5 flex flex-col gap-4">
      {preview && (
        <div
          className="w-full rounded-xl overflow-hidden flex items-center justify-center"
          style={{ maxHeight: "120px", background: "var(--bg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="object-contain max-h-[120px] w-auto opacity-60" />
        </div>
      )}

      <div className="flex gap-3 items-start">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "#fee2e2" }}
        >
          ⚠️
        </div>
        <div>
          <p className="font-semibold text-base">Couldn&apos;t parse this one</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--ink-2)" }}>{message}</p>
        </div>
      </div>

      <button className="btn btn-surface w-full" onClick={() => setIdle()} type="button">
        Try another screenshot
      </button>
    </div>
  );
}
