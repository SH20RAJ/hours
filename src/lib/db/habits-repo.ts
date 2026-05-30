import type { Habit, HabitEntry } from "@/lib/types";
import { getDb } from "./db";
import { nowIso, uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export async function getAllHabits(): Promise<Habit[]> {
  return getDb().habits.orderBy("sortOrder").toArray();
}

export async function addHabit(
  input: Omit<Habit, "id" | "createdAt" | "updatedAt" | "sortOrder"> &
    Partial<Pick<Habit, "sortOrder">>,
): Promise<Habit> {
  const ts = nowIso();
  const db = getDb();
  // Append to the end of the list unless an explicit order is given.
  const count = await db.habits.count();
  const habit: Habit = {
    sortOrder: count,
    ...input,
    id: uid(),
    createdAt: ts,
    updatedAt: ts,
  };
  await db.habits.add(habit);
  return habit;
}

export async function updateHabit(
  id: string,
  patch: Partial<Omit<Habit, "id" | "createdAt">>,
): Promise<void> {
  await getDb().habits.update(id, { ...patch, updatedAt: nowIso() });
}

/** Delete a habit and all of its day entries in one transaction. */
export async function deleteHabit(id: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.habits, db.habitEntries], async () => {
    await db.habitEntries.where("habitId").equals(id).delete();
    await db.habits.delete(id);
  });
}

// ---------------------------------------------------------------------------
// Habit entries (one row per habit per day)
// ---------------------------------------------------------------------------

export async function getAllHabitEntries(): Promise<HabitEntry[]> {
  return getDb().habitEntries.toArray();
}

export async function getEntry(
  habitId: string,
  date: string,
): Promise<HabitEntry | undefined> {
  return getDb()
    .habitEntries.where("[habitId+date]")
    .equals([habitId, date])
    .first();
}

/**
 * Set the completion count for a habit on a given day. A count of 0 removes the
 * entry entirely so empty days never linger in storage. Returns the resulting
 * count.
 */
export async function setEntryCount(
  habitId: string,
  date: string,
  count: number,
): Promise<number> {
  const db = getDb();
  const existing = await getEntry(habitId, date);
  const next = Math.max(0, Math.floor(count));

  if (next === 0) {
    if (existing) await db.habitEntries.delete(existing.id);
    return 0;
  }

  const ts = nowIso();
  if (existing) {
    await db.habitEntries.update(existing.id, { count: next, updatedAt: ts });
  } else {
    await db.habitEntries.add({
      id: uid(),
      habitId,
      date,
      count: next,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  return next;
}

/** Increment by +1 (used by the card's tap-to-complete). Returns new count. */
export async function incrementEntry(
  habitId: string,
  date: string,
): Promise<number> {
  const existing = await getEntry(habitId, date);
  return setEntryCount(habitId, date, (existing?.count ?? 0) + 1);
}

export async function deleteEntriesForHabit(habitId: string): Promise<void> {
  await getDb().habitEntries.where("habitId").equals(habitId).delete();
}

export async function bulkInsertHabits(habits: Habit[]): Promise<void> {
  if (habits.length) await getDb().habits.bulkPut(habits);
}

export async function bulkInsertHabitEntries(
  entries: HabitEntry[],
): Promise<void> {
  if (entries.length) await getDb().habitEntries.bulkPut(entries);
}
