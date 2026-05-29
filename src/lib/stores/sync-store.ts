"use client";

import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  setStatus: (status: SyncStatus, error?: string | null) => void;
  setLastSyncedAt: (iso: string) => void;
}

const LAST_SYNCED_KEY = "hours-last-synced";

function readLastSynced(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_SYNCED_KEY);
  } catch {
    return null;
  }
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",
  lastSyncedAt: readLastSynced(),
  error: null,
  setStatus: (status, error = null) => set({ status, error }),
  setLastSyncedAt: (iso) => {
    try {
      window.localStorage.setItem(LAST_SYNCED_KEY, iso);
    } catch {
      /* storage may be unavailable */
    }
    set({ lastSyncedAt: iso });
  },
}));
