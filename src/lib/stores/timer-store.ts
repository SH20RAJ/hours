"use client";

import { create } from "zustand";
import type { TimerState } from "@/lib/types";
import {
  clearActiveTimer,
  getActiveTimer,
  saveActiveTimer,
} from "@/lib/db";
import { uid } from "@/lib/utils";

interface TimerStore {
  timer: TimerState | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  /** Start a new timer. Refuses if one is already active. */
  start: (input: {
    activityName: string;
    categoryId: string;
    notes?: string;
    tags?: string[];
  }) => Promise<boolean>;

  pause: () => Promise<void>;
  resume: () => Promise<void>;
  /** Update the live timer's editable fields. */
  patch: (patch: Partial<Pick<TimerState, "activityName" | "categoryId" | "notes" | "tags">>) => Promise<void>;

  /** Stop and return the final timer state plus computed start/end/duration. */
  stop: () => Promise<{
    timer: TimerState;
    startTime: string;
    endTime: string;
    durationMs: number;
  } | null>;

  /** Discard without saving. */
  discard: () => Promise<void>;
}

/**
 * Elapsed active time, computed purely from timestamps so it is correct after
 * sleep, refresh, or tab-throttling. Paused time is excluded by tracking
 * accumulated paused milliseconds plus any in-progress pause.
 */
export function elapsedMs(timer: TimerState, at: number = Date.now()): number {
  const started = new Date(timer.startedAt).getTime();
  let paused = timer.totalPausedMs;
  if (timer.status === "paused" && timer.pausedAt) {
    paused += at - new Date(timer.pausedAt).getTime();
  }
  return Math.max(0, at - started - paused);
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  timer: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const timer = await getActiveTimer();
      set({ timer, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  start: async (input) => {
    if (get().timer) return false; // prevent multiple active timers
    const timer: TimerState = {
      id: uid(),
      activityName: input.activityName.trim() || "Focus session",
      categoryId: input.categoryId,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      totalPausedMs: 0,
      status: "running",
      notes: input.notes,
      tags: input.tags ?? [],
    };
    await saveActiveTimer(timer);
    set({ timer });
    return true;
  },

  pause: async () => {
    const timer = get().timer;
    if (!timer || timer.status === "paused") return;
    const next: TimerState = {
      ...timer,
      status: "paused",
      pausedAt: new Date().toISOString(),
    };
    await saveActiveTimer(next);
    set({ timer: next });
  },

  resume: async () => {
    const timer = get().timer;
    if (!timer || timer.status === "running" || !timer.pausedAt) return;
    const pausedDuration = Date.now() - new Date(timer.pausedAt).getTime();
    const next: TimerState = {
      ...timer,
      status: "running",
      pausedAt: null,
      totalPausedMs: timer.totalPausedMs + Math.max(0, pausedDuration),
    };
    await saveActiveTimer(next);
    set({ timer: next });
  },

  patch: async (patch) => {
    const timer = get().timer;
    if (!timer) return;
    const next = { ...timer, ...patch };
    await saveActiveTimer(next);
    set({ timer: next });
  },

  stop: async () => {
    const timer = get().timer;
    if (!timer) return null;

    const endMs = Date.now();
    // elapsedMs already excludes an in-progress pause, so duration is correct
    // whether we stop while running or paused.
    const durationMs = elapsedMs(timer, endMs);
    const startTime = timer.startedAt;
    const endTime = new Date(endMs).toISOString();

    await clearActiveTimer();
    set({ timer: null });

    return { timer, startTime, endTime, durationMs };
  },

  discard: async () => {
    await clearActiveTimer();
    set({ timer: null });
  },
}));
