import type {
  AppSettings,
  Category,
  ExportPayload,
  Goal,
  TimeSession,
  TimerState,
} from "@/lib/types";
import {
  ACTIVE_TIMER_ID,
  DATA_VERSION,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  SETTINGS_ID,
} from "@/lib/constants";
import { getDb } from "./db";
import { nowIso, uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Ensure default categories and settings exist. Runs on every boot but only
 * writes when the tables are empty, so it is safe and idempotent.
 */
export async function seedIfNeeded(): Promise<void> {
  const db = getDb();
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const ts = nowIso();
    const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      id: uid(),
      createdAt: ts,
      updatedAt: ts,
    }));
    await db.categories.bulkAdd(categories);
  }

  const existingSettings = await db.settings.get(SETTINGS_ID);
  if (!existingSettings) {
    await db.settings.put({ ...DEFAULT_SETTINGS, id: SETTINGS_ID });
  }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getAllSessions(): Promise<TimeSession[]> {
  return getDb().sessions.orderBy("startTime").reverse().toArray();
}

export async function addSession(
  input: Omit<TimeSession, "id" | "createdAt" | "updatedAt">,
): Promise<TimeSession> {
  const ts = nowIso();
  const session: TimeSession = { ...input, id: uid(), createdAt: ts, updatedAt: ts };
  await getDb().sessions.add(session);
  return session;
}

export async function updateSession(
  id: string,
  patch: Partial<Omit<TimeSession, "id" | "createdAt">>,
): Promise<void> {
  await getDb().sessions.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteSession(id: string): Promise<void> {
  await getDb().sessions.delete(id);
}

export async function countSessionsForCategory(categoryId: string): Promise<number> {
  return getDb().sessions.where("categoryId").equals(categoryId).count();
}

export async function reassignSessions(
  fromCategoryId: string,
  toCategoryId: string,
): Promise<void> {
  const db = getDb();
  await db.sessions
    .where("categoryId")
    .equals(fromCategoryId)
    .modify({ categoryId: toCategoryId, updatedAt: nowIso() });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getAllCategories(): Promise<Category[]> {
  return getDb().categories.orderBy("name").toArray();
}

export async function addCategory(
  input: Omit<Category, "id" | "createdAt" | "updatedAt">,
): Promise<Category> {
  const ts = nowIso();
  const category: Category = { ...input, id: uid(), createdAt: ts, updatedAt: ts };
  await getDb().categories.add(category);
  return category;
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, "id" | "createdAt">>,
): Promise<void> {
  await getDb().categories.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteCategory(id: string): Promise<void> {
  await getDb().categories.delete(id);
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function getAllGoals(): Promise<Goal[]> {
  return getDb().goals.orderBy("isActive").reverse().toArray();
}

export async function addGoal(input: Omit<Goal, "id" | "createdAt">): Promise<Goal> {
  const goal: Goal = { ...input, id: uid(), createdAt: nowIso() };
  await getDb().goals.add(goal);
  return goal;
}

export async function updateGoal(
  id: string,
  patch: Partial<Omit<Goal, "id" | "createdAt">>,
): Promise<void> {
  await getDb().goals.update(id, patch);
}

export async function deleteGoal(id: string): Promise<void> {
  await getDb().goals.delete(id);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<AppSettings> {
  const settings = await getDb().settings.get(SETTINGS_ID);
  return settings ?? { ...DEFAULT_SETTINGS, id: SETTINGS_ID };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await getDb().settings.put({ ...settings, id: SETTINGS_ID });
}

// ---------------------------------------------------------------------------
// Active timer (single row)
// ---------------------------------------------------------------------------

export async function getActiveTimer(): Promise<TimerState | null> {
  const timer = await getDb().activeTimer.get(ACTIVE_TIMER_ID);
  return timer ?? null;
}

export async function saveActiveTimer(timer: TimerState): Promise<void> {
  await getDb().activeTimer.put({ ...timer, id: ACTIVE_TIMER_ID });
}

export async function clearActiveTimer(): Promise<void> {
  await getDb().activeTimer.delete(ACTIVE_TIMER_ID);
}

// ---------------------------------------------------------------------------
// Export / import / reset
// ---------------------------------------------------------------------------

export async function exportAllData(): Promise<ExportPayload> {
  const db = getDb();
  const [sessions, categories, goals, settings] = await Promise.all([
    db.sessions.toArray(),
    db.categories.toArray(),
    db.goals.toArray(),
    db.settings.get(SETTINGS_ID),
  ]);
  return {
    version: DATA_VERSION,
    exportedAt: nowIso(),
    sessions,
    categories,
    goals,
    settings: settings ?? null,
  };
}

/**
 * Validate an unknown parsed JSON object as an ExportPayload. Returns a typed
 * payload or throws with a human-readable reason.
 */
export function validateImport(data: unknown): ExportPayload {
  if (!data || typeof data !== "object") {
    throw new Error("File is not a valid Hours backup.");
  }
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.sessions) || !Array.isArray(obj.categories)) {
    throw new Error("Backup is missing sessions or categories.");
  }
  // Light structural checks on the first item of each table.
  const sample = obj.sessions[0] as Record<string, unknown> | undefined;
  if (sample && (typeof sample.id !== "string" || typeof sample.startTime !== "string")) {
    throw new Error("Sessions in this backup are malformed.");
  }
  return {
    version: typeof obj.version === "number" ? obj.version : DATA_VERSION,
    exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : nowIso(),
    sessions: obj.sessions as TimeSession[],
    categories: obj.categories as Category[],
    goals: Array.isArray(obj.goals) ? (obj.goals as Goal[]) : [],
    settings: (obj.settings as AppSettings | null) ?? null,
  };
}

/** Replace all data with the imported payload inside a single transaction. */
export async function importAllData(payload: ExportPayload): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    db.sessions,
    db.categories,
    db.goals,
    db.settings,
    async () => {
      await Promise.all([
        db.sessions.clear(),
        db.categories.clear(),
        db.goals.clear(),
      ]);
      await db.sessions.bulkAdd(payload.sessions);
      await db.categories.bulkAdd(payload.categories);
      if (payload.goals.length) await db.goals.bulkAdd(payload.goals);
      if (payload.settings) {
        await db.settings.put({ ...payload.settings, id: SETTINGS_ID });
      }
    },
  );
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    [db.sessions, db.categories, db.goals, db.settings, db.activeTimer],
    async () => {
      await Promise.all([
        db.sessions.clear(),
        db.categories.clear(),
        db.goals.clear(),
        db.settings.clear(),
        db.activeTimer.clear(),
      ]);
    },
  );
  await seedIfNeeded();
}

export async function bulkInsertSessions(sessions: TimeSession[]): Promise<void> {
  await getDb().sessions.bulkAdd(sessions);
}
