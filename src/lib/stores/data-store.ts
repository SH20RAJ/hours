"use client";

import { create } from "zustand";
import type {
  AppSettings,
  Category,
  ExportPayload,
  Goal,
  TimeSession,
} from "@/lib/types";
import { DEFAULT_SETTINGS, SETTINGS_ID } from "@/lib/constants";
import {
  addCategory as dbAddCategory,
  addGoal as dbAddGoal,
  addSession as dbAddSession,
  bulkInsertSessions,
  clearAllData,
  countSessionsForCategory,
  deleteCategory as dbDeleteCategory,
  deleteGoal as dbDeleteGoal,
  deleteSession as dbDeleteSession,
  exportAllData,
  generateDemoSessions,
  getAllCategories,
  getAllGoals,
  getAllSessions,
  getSettings,
  importAllData,
  isIndexedDbAvailable,
  reassignSessions,
  saveSettings,
  seedIfNeeded,
  updateCategory as dbUpdateCategory,
  updateGoal as dbUpdateGoal,
  updateSession as dbUpdateSession,
  validateImport,
} from "@/lib/db";

const FALLBACK_SETTINGS: AppSettings = { ...DEFAULT_SETTINGS, id: SETTINGS_ID };

interface DataState {
  sessions: TimeSession[];
  categories: Category[];
  goals: Goal[];
  settings: AppSettings;
  hydrated: boolean;
  dbAvailable: boolean;
  error: string | null;

  hydrate: () => Promise<void>;

  addSession: (
    input: Omit<TimeSession, "id" | "createdAt" | "updatedAt">,
  ) => Promise<TimeSession>;
  updateSession: (
    id: string,
    patch: Partial<Omit<TimeSession, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  addCategory: (
    input: Omit<Category, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Category>;
  updateCategory: (
    id: string,
    patch: Partial<Omit<Category, "id" | "createdAt">>,
  ) => Promise<void>;
  /** Returns the number of sessions using this category (0 if deleted). */
  deleteCategory: (id: string, reassignToId?: string) => Promise<void>;

  addGoal: (input: Omit<Goal, "id" | "createdAt">) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id" | "createdAt">>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Omit<AppSettings, "id">>) => Promise<void>;

  loadDemoData: () => Promise<void>;
  clearAll: () => Promise<void>;
  exportData: () => Promise<ExportPayload>;
  importData: (raw: string) => Promise<void>;

  getCategory: (id: string) => Category | undefined;
  sessionsUsingCategory: (id: string) => Promise<number>;
}

export const useDataStore = create<DataState>((set, get) => ({
  sessions: [],
  categories: [],
  goals: [],
  settings: FALLBACK_SETTINGS,
  hydrated: false,
  dbAvailable: true,
  error: null,

  hydrate: async () => {
    if (!isIndexedDbAvailable()) {
      set({
        dbAvailable: false,
        hydrated: true,
        error:
          "Local storage isn't available in this browser. Your data can't be saved.",
      });
      return;
    }
    try {
      await seedIfNeeded();
      const [sessions, categories, goals, settings] = await Promise.all([
        getAllSessions(),
        getAllCategories(),
        getAllGoals(),
        getSettings(),
      ]);
      set({ sessions, categories, goals, settings, hydrated: true, error: null });
    } catch (err) {
      set({
        hydrated: true,
        error: err instanceof Error ? err.message : "Failed to load your data.",
      });
    }
  },

  addSession: async (input) => {
    const session = await dbAddSession(input);
    set((s) => ({ sessions: sortSessions([session, ...s.sessions]) }));
    return session;
  },

  updateSession: async (id, patch) => {
    await dbUpdateSession(id, patch);
    set((s) => ({
      sessions: sortSessions(
        s.sessions.map((sess) =>
          sess.id === id
            ? { ...sess, ...patch, updatedAt: new Date().toISOString() }
            : sess,
        ),
      ),
    }));
  },

  deleteSession: async (id) => {
    await dbDeleteSession(id);
    set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
  },

  addCategory: async (input) => {
    const category = await dbAddCategory(input);
    set((s) => ({ categories: [...s.categories, category].sort(byName) }));
    return category;
  },

  updateCategory: async (id, patch) => {
    await dbUpdateCategory(id, patch);
    set((s) => ({
      categories: s.categories
        .map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c))
        .sort(byName),
    }));
  },

  deleteCategory: async (id, reassignToId) => {
    if (reassignToId) {
      await reassignSessions(id, reassignToId);
    }
    await dbDeleteCategory(id);
    const sessions = await getAllSessions();
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      sessions,
    }));
  },

  addGoal: async (input) => {
    const goal = await dbAddGoal(input);
    set((s) => ({ goals: [goal, ...s.goals] }));
    return goal;
  },

  updateGoal: async (id, patch) => {
    await dbUpdateGoal(id, patch);
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  },

  deleteGoal: async (id) => {
    await dbDeleteGoal(id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    await saveSettings(next);
    set({ settings: next });
  },

  loadDemoData: async () => {
    const categories = get().categories;
    const demo = generateDemoSessions(categories);
    await bulkInsertSessions(demo);
    const sessions = await getAllSessions();
    set({ sessions });
  },

  clearAll: async () => {
    await clearAllData();
    const [sessions, categories, goals, settings] = await Promise.all([
      getAllSessions(),
      getAllCategories(),
      getAllGoals(),
      getSettings(),
    ]);
    set({ sessions, categories, goals, settings });
  },

  exportData: async () => exportAllData(),

  importData: async (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("That file isn't valid JSON.");
    }
    const payload = validateImport(parsed);
    await importAllData(payload);
    const [sessions, categories, goals, settings] = await Promise.all([
      getAllSessions(),
      getAllCategories(),
      getAllGoals(),
      getSettings(),
    ]);
    set({ sessions, categories, goals, settings });
  },

  getCategory: (id) => get().categories.find((c) => c.id === id),
  sessionsUsingCategory: (id) => countSessionsForCategory(id),
}));

function byName(a: Category, b: Category): number {
  return a.name.localeCompare(b.name);
}

function sortSessions(sessions: TimeSession[]): TimeSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );
}
