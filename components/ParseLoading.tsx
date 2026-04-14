"use client";

export function ParseLoading({ preview }: { preview: string }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Image preview */}
      <div className="card overflow-hidden max-h-48 flex items-center justify-center bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Screenshot being parsed"
          className="object-contain max-h-48 w-auto"
        />
      </div>

      {/* Loading card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl animate-spin" aria-hidden="true">⚙️</span>
          <p className="font-bold text-lg">Reading your screenshot…</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="shimmer h-6 w-3/4 rounded" />
          <div className="shimmer h-5 w-1/2 rounded" />
          <div className="shimmer h-5 w-2/3 rounded" />
          <div className="shimmer h-5 w-2/5 rounded" />
        </div>
      </div>
    </div>
  );
}
