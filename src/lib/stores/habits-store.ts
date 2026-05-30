"use client";

import { create } from "zustand";
import type { Habit, HabitEntry } from "@/lib/types";
import {
  addHabit as dbAddHabit,
  bulkInsertHabitEntries,
  bulkInsertHabits,
  deleteHabit as dbDeleteHabit,
  getAllHabitEntries,
  getAllHabits,
  incrementEntry,
  isIndexedDbAvailable,
  setEntryCount,
  updateHabit as dbUpdateHabit,
} from "@/lib/db";
import { dateKey } from "@/lib/analytics/habits";

interface HabitsState {
  habits: Habit[];
  entries: HabitEntry[];
  hydrated: boolean;

  hydrate: () => Promise<void>;

  addHabit: (
    input: Omit<Habit, "id" | "createdAt" | "updatedAt" | "sortOrder" | "archived"> &
      Partial<Pick<Habit, "archived">>,
  ) => Promise<Habit>;
  updateHabit: (
    id: string,
    patch: Partial<Omit<Habit, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  /** +1 completion for a habit on a date (defaults to today). */
  incrementToday: (habitId: string, date?: Date) => Promise<void>;
  /** Set an exact count for a date (0 clears the day). */
  setCount: (habitId: string, date: Date, count: number) => Promise<void>;
  /** Toggle a day between complete (target) and empty — used by grid taps. */
  toggleDay: (habitId: string, date: Date) => Promise<void>;
}

/** Reload entries from Dexie into the store (entries are small + bounded). */
async function refreshEntries(set: (partial: Partial<HabitsState>) => void) {
  const entries = await getAllHabitEntries();
  set({ entries });
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  entries: [],
  hydrated: false,

  hydrate: async () => {
    if (!isIndexedDbAvailable()) {
      set({ hydrated: true });
      return;
    }
    try {
      const [habits, entries] = await Promise.all([
        getAllHabits(),
        getAllHabitEntries(),
      ]);
      set({ habits, entries, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addHabit: async (input) => {
    const habit = await dbAddHabit({ archived: false, ...input });
    set((s) => ({ habits: [...s.habits, habit].sort((a, b) => a.sortOrder - b.sortOrder) }));
    return habit;
  },

  updateHabit: async (id, patch) => {
    await dbUpdateHabit(id, patch);
    set((s) => ({
      habits: s.habits
        .map((h) => (h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  },

  deleteHabit: async (id) => {
    await dbDeleteHabit(id);
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      entries: s.entries.filter((e) => e.habitId !== id),
    }));
  },

  incrementToday: async (habitId, date = new Date()) => {
    await incrementEntry(habitId, dateKey(date));
    await refreshEntries(set);
  },

  setCount: async (habitId, date, count) => {
    await setEntryCount(habitId, dateKey(date), count);
    await refreshEntries(set);
  },

  toggleDay: async (habitId, date) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;
    const key = dateKey(date);
    const current = get()
      .entries.filter((e) => e.habitId === habitId && e.date === key)
      .reduce((sum, e) => sum + e.count, 0);
    // Complete -> clear; otherwise bump to the target so one tap marks it done.
    const next = current >= habit.targetPerDay ? 0 : habit.targetPerDay;
    await setEntryCount(habitId, key, next);
    await refreshEntries(set);
  },
}));

/** Re-export for callers that import only from the store module. */
export { bulkInsertHabits, bulkInsertHabitEntries };
