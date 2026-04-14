"use client";

import React, { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { EventDraft } from "@/lib/types";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/gif",
];

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const [header, base64] = dataUrl.split(",");
      const mediaType = header.split(":")[1].split(";")[0];
      resolve({ base64, mediaType, preview: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function parseImage(
  base64: string,
  mediaType: string,
  setConfirming: (event: import("@/lib/types").EventDraft, preview: string) => void,
  setError: (message: string, preview?: string) => void,
  preview: string
) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentDateISO = new Date().toISOString();

  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mediaType, userTimezone, currentDateISO }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const msg =
      data.reason === "not_an_event"
        ? "No calendar event found in that image. Try a screenshot of an event invite, DM, or booking confirmation."
        : data.reason === "rate_limited"
        ? data.error
        : "Could not parse the image. Please try a clearer screenshot.";
    setError(msg, preview);
    return;
  }

  setConfirming(data.event, preview);
}

export function CaptureZone() {
  const { setParsing, setConfirming, setError } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please use a PNG, JPEG, WebP, or GIF image.");
        return;
      }

      const { base64, mediaType, preview } = await fileToBase64(file);
      setParsing(preview);

      await parseImage(base64, mediaType, setConfirming, setError, preview);
    },
    [setParsing, setConfirming, setError]
  );

  const onPaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (file) await processFile(file);
    },
    [processFile]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) await processFile(file);
    },
    [processFile]
  );

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div
      className={`drop-zone flex flex-col items-center justify-center gap-6 p-10 min-h-[320px] cursor-pointer select-none ${dragOver ? "drag-over" : ""}`}
      onPaste={onPaste}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => fileInputRef.current?.click()}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      role="button"
      aria-label="Upload image: paste, drag, or click to browse"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="text-6xl select-none" aria-hidden="true">📸</div>

      <div className="text-center">
        <p className="text-2xl font-bold tracking-tight">
          Paste, drop, or tap.
        </p>
        <p className="text-base text-ink/60 mt-1">
          Screenshot any event — iMessage, Telegram, Luma, booking confirmation
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <kbd className="card-sm px-3 py-1 text-sm font-mono text-ink/70">
          ⌘V paste
        </kbd>
        <kbd className="card-sm px-3 py-1 text-sm font-mono text-ink/70">
          drag &amp; drop
        </kbd>
        <button
          className="btn btn-primary text-sm"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          type="button"
        >
          Browse file
        </button>
      </div>
    </div>
  );
}
