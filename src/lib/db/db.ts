import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  Category,
  Goal,
  Habit,
  HabitEntry,
  TimeSession,
  TimerState,
} from "@/lib/types";
import { DB_NAME } from "@/lib/constants";

/**
 * Single Dexie database for the whole app. The activeTimer table holds at most
 * one row so the running timer survives refresh. Settings likewise is a
 * single-row table keyed by a fixed id.
 */
export class HoursDatabase extends Dexie {
  sessions!: Table<TimeSession, string>;
  categories!: Table<Category, string>;
  goals!: Table<Goal, string>;
  settings!: Table<AppSettings, string>;
  activeTimer!: Table<TimerState, string>;
  habits!: Table<Habit, string>;
  habitEntries!: Table<HabitEntry, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      sessions: "id, categoryId, startTime, endTime, createdAt",
      categories: "id, name, identity, tone",
      goals: "id, type, period, isActive",
      settings: "id",
      activeTimer: "id",
    });
    // v2 adds habit tracking. Additive only — existing stores are unchanged, so
    // Dexie keeps all prior data and just creates the two new tables. The
    // [habitId+date] compound index makes per-day lookups and toggles fast.
    this.version(2).stores({
      habits: "id, sortOrder, archived, createdAt",
      habitEntries: "id, habitId, date, [habitId+date]",
    });
  }
}

let dbInstance: HoursDatabase | null = null;

/**
 * Lazily construct the database. IndexedDB only exists in the browser, so we
 * guard against SSR access. Throws a friendly error if storage is unavailable.
 */
export function getDb(): HoursDatabase {
  if (typeof window === "undefined") {
    throw new Error("Database is only available in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new HoursDatabase();
  }
  return dbInstance;
}

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}
