"use client";

import { create } from "zustand";
import type { AppState, EventDraft, DeliveryMode } from "@/lib/types";

interface Store {
  state: AppState;
  setIdle: () => void;
  setParsing: (preview: string) => void;
  setConfirming: (event: EventDraft, preview: string) => void;
  setDelivering: (event: EventDraft, mode: DeliveryMode) => void;
  setDone: (event: EventDraft, mode: DeliveryMode) => void;
  setError: (message: string, preview?: string) => void;
  updateEvent: (patch: Partial<EventDraft>) => void;
}

export const useAppStore = create<Store>((set, get) => ({
  state: { status: "idle" },

  setIdle: () => set({ state: { status: "idle" } }),

  setParsing: (preview) => set({ state: { status: "parsing", preview } }),

  setConfirming: (event, preview) =>
    set({ state: { status: "confirming", event, preview } }),

  setDelivering: (event, mode) =>
    set({ state: { status: "delivering", event, mode } }),

  setDone: (event, mode) =>
    set({ state: { status: "done", event, mode } }),

  setError: (message, preview) =>
    set({ state: { status: "error", message, preview } }),

  updateEvent: (patch) => {
    const s = get().state;
    if (s.status === "confirming") {
      set({
        state: {
          ...s,
          event: { ...s.event, ...patch },
          // Clear ambiguity flag for patched fields
          ...(patch &&
            Object.keys(patch).length > 0 && {
              event: {
                ...s.event,
                ...patch,
                ambiguities: s.event.ambiguities.filter(
                  (a) => !Object.keys(patch).some((k) => a.includes(k))
                ),
              },
            }),
        },
      });
    }
  },
}));
