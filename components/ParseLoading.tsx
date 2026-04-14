"use client";

export function ParseLoading({ preview }: { preview: string }) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Thumbnail */}
      <div
        className="w-full rounded-xl overflow-hidden flex items-center justify-center"
        style={{ maxHeight: "140px", background: "var(--bg)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="object-contain max-h-[140px] w-auto" />
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 px-1">
        <div className="spinner" />
        <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
          Reading your screenshot…
        </span>
      </div>

      {/* Skeleton lines */}
      <div className="flex flex-col gap-2 px-1">
        <div className="shimmer h-5 w-3/4" />
        <div className="shimmer h-4 w-1/2" />
        <div className="shimmer h-4 w-2/3" />
      </div>
    </div>
  );
}
