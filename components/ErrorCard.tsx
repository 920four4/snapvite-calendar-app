"use client";

import { useAppStore } from "@/lib/store";

export function ErrorCard({ message, preview }: { message: string; preview?: string }) {
  const { setIdle } = useAppStore();

  return (
    <div className="card p-5 flex flex-col gap-4 fade-up">
      {preview && (
        <div
          className="w-full rounded-xl overflow-hidden flex items-center justify-center"
          style={{ maxHeight: "120px", background: "var(--bg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="object-contain max-h-[120px] w-auto"
            style={{ filter: "grayscale(0.4)", opacity: 0.7 }}
          />
        </div>
      )}

      <div className="flex gap-3 items-start">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
            boxShadow: "inset 0 0 0 1px rgba(153,27,27,0.12)",
          }}
        >
          ⚠︎
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-base">Couldn&apos;t parse this one</p>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>{message}</p>
        </div>
      </div>

      <button className="btn btn-primary w-full" onClick={() => setIdle()} type="button">
        Try another screenshot
      </button>
    </div>
  );
}
