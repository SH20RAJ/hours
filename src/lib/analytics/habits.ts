import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { Habit, HabitDay, HabitEntry, HabitStats } from "@/lib/types";

/** Local calendar-day key (YYYY-MM-DD). Matches how entries are stored. */
export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Map of date-key -> total count for one habit. */
function entryCountMap(entries: HabitEntry[], habitId: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.habitId !== habitId) continue;
    map.set(e.date, (map.get(e.date) ?? 0) + e.count);
  }
  return map;
}

/** Intensity bucket (0-4) for a day's count relative to the habit target. */
function levelFor(count: number, target: number): HabitDay["level"] {
  if (count <= 0) return 0;
  const ratio = count / Math.max(1, target);
  if (ratio >= 1) return 4;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.33) return 2;
  return 1;
}

/**
 * Build the last `days` days (oldest first) as HabitDay points for the
 * GitHub-style grid. `days` is clamped so the grid always starts on a clean
 * week boundary handled by the renderer.
 */
export function buildHabitDays(
  habit: Habit,
  entries: HabitEntry[],
  days = 365,
): HabitDay[] {
  const counts = entryCountMap(entries, habit.id);
  const today = new Date();
  const start = subDays(today, days - 1);
  const result: HabitDay[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = dateKey(day);
    const count = counts.get(key) ?? 0;
    result.push({
      date: key,
      count,
      level: levelFor(count, habit.targetPerDay),
      complete: count >= habit.targetPerDay,
    });
  }
  return result;
}

/**
 * Current & longest streaks plus completion stats. A day counts toward a streak
 * only when its count meets the habit's daily target. The current streak allows
 * a one-day grace: if today isn't done yet but yesterday was, the streak still
 * stands (it only breaks once a full day is missed).
 */
export function calculateHabitStats(
  habit: Habit,
  entries: HabitEntry[],
): HabitStats {
  const counts = entryCountMap(entries, habit.id);
  const target = Math.max(1, habit.targetPerDay);
  const isComplete = (key: string) => (counts.get(key) ?? 0) >= target;

  const today = new Date();
  const todayKey = dateKey(today);
  const todayCount = counts.get(todayKey) ?? 0;
  const completedToday = todayCount >= target;

  // Current streak — walk backwards from today (or yesterday if today's blank).
  let currentStreak = 0;
  let cursor = completedToday ? today : subDays(today, 1);
  for (let i = 0; i < 4000; i++) {
    if (isComplete(dateKey(cursor))) {
      currentStreak++;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }
  // If today is blank AND yesterday was blank, there is no live streak.
  if (!completedToday && currentStreak === 0) currentStreak = 0;

  // Longest streak + total — scan all completed days in date order.
  const completedDays = [...counts.entries()]
    .filter(([key]) => isComplete(key))
    .map(([key]) => key)
    .sort();

  let longestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of completedDays) {
    const d = parseISO(key);
    if (prev && differenceInCalendarDays(d, prev) === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  const totalCompletedDays = completedDays.length;
  const daysSinceStart =
    Math.max(0, differenceInCalendarDays(today, parseISO(dateKey(parseISO(habit.createdAt))))) + 1;
  const completionRate =
    daysSinceStart > 0
      ? Math.min(100, Math.round((totalCompletedDays / daysSinceStart) * 100))
      : 0;

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCompletedDays,
    completionRate,
    completedToday,
    todayCount,
  };
}
