"use client";

import React, { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { EventDraft } from "@/lib/types";

const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/jpg",
  "image/webp", "image/heic", "image/gif",
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
  setConfirming: (event: EventDraft, preview: string) => void,
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
        ? "No calendar event found in that image. Try a screenshot of an invite, message, or booking confirmation."
        : data.reason === "rate_limited"
        ? data.error
        : "Couldn't parse the image. Try a clearer or higher-resolution screenshot.";
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
      className={`drop-zone flex flex-col items-center justify-center gap-5 p-10 min-h-[260px] cursor-pointer select-none ${dragOver ? "drag-over" : ""}`}
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

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "rgba(255,94,91,0.08)" }}
      >
        📸
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
          Drop a screenshot here
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
          or paste with ⌘V · works with iMessage, Telegram, Luma, and more
        </p>
      </div>

      <button
        className="btn btn-surface text-sm"
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        type="button"
      >
        Browse file
      </button>
    </div>
  );
}
