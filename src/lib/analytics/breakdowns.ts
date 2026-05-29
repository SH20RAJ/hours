import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  startOfDay,
  subDays,
} from "date-fns";
import type {
  Category,
  CategoryBreakdownItem,
  DailyTrendPoint,
  IdentityBreakdownItem,
  ProductiveSplit,
  TimeSession,
  WeeklyStats,
} from "@/lib/types";
import { colorHex } from "@/lib/constants";
import { getSessionsForDay, getTotalDuration } from "./time";

function categoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

/** Per-category totals, sorted by time desc. Categories with no time are dropped. */
export function getCategoryBreakdown(
  sessions: TimeSession[],
  categories: Category[],
): CategoryBreakdownItem[] {
  const map = categoryMap(categories);
  const totals = new Map<string, number>();
  for (const s of sessions) {
    totals.set(s.categoryId, (totals.get(s.categoryId) ?? 0) + s.durationMs);
  }
  const grandTotal = getTotalDuration(sessions);
  const items: CategoryBreakdownItem[] = [];
  for (const [categoryId, durationMs] of totals) {
    const category = map.get(categoryId);
    if (!category) continue;
    items.push({
      category,
      durationMs,
      percentage: grandTotal > 0 ? (durationMs / grandTotal) * 100 : 0,
    });
  }
  return items.sort((a, b) => b.durationMs - a.durationMs);
}

/** Identity signals: categories grouped by their identity label. */
export function getIdentityBreakdown(
  sessions: TimeSession[],
  categories: Category[],
): IdentityBreakdownItem[] {
  const map = categoryMap(categories);
  const totals = new Map<string, number>();
  const colorByIdentity = new Map<string, string>();

  for (const s of sessions) {
    const category = map.get(s.categoryId);
    if (!category) continue;
    const identity = category.identity || "Unlabeled";
    totals.set(identity, (totals.get(identity) ?? 0) + s.durationMs);
    if (!colorByIdentity.has(identity)) {
      colorByIdentity.set(identity, colorHex(category.color));
    }
  }

  const grandTotal = getTotalDuration(sessions);
  const items: IdentityBreakdownItem[] = [];
  for (const [identity, durationMs] of totals) {
    items.push({
      identity,
      durationMs,
      percentage: grandTotal > 0 ? (durationMs / grandTotal) * 100 : 0,
      color: colorByIdentity.get(identity) ?? "#6b7280",
    });
  }
  return items.sort((a, b) => b.durationMs - a.durationMs);
}

/** Time split by tone — drives the productive-vs-consuming story. */
export function getProductiveVsNegativeTime(
  sessions: TimeSession[],
  categories: Category[],
): ProductiveSplit {
  const map = categoryMap(categories);
  let positiveMs = 0;
  let neutralMs = 0;
  let negativeMs = 0;

  for (const s of sessions) {
    const category = map.get(s.categoryId);
    const tone = category?.tone ?? "neutral";
    if (tone === "positive") positiveMs += s.durationMs;
    else if (tone === "negative") negativeMs += s.durationMs;
    else neutralMs += s.durationMs;
  }

  const total = positiveMs + neutralMs + negativeMs;
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  return {
    positiveMs,
    neutralMs,
    negativeMs,
    positivePct: pct(positiveMs),
    neutralPct: pct(neutralMs),
    negativePct: pct(negativeMs),
  };
}

/** Daily totals over the last `days` days, oldest first — for trend lines. */
export function getDailyTrend(sessions: TimeSession[], days = 14): DailyTrendPoint[] {
  const end = startOfDay(new Date());
  const start = subDays(end, days - 1);
  const allDays = eachDayOfInterval({ start, end });

  return allDays.map((day) => {
    const daySessions = getSessionsForDay(sessions, day);
    const durationMs = getTotalDuration(daySessions);
    return {
      date: day.toISOString(),
      label: format(day, "EEE"),
      durationMs,
      hours: durationMs / (1000 * 60 * 60),
    };
  });
}

export function getWeeklyStats(weekSessions: TimeSession[]): WeeklyStats {
  const totalMs = getTotalDuration(weekSessions);

  const byDay = new Map<string, number>();
  for (const s of weekSessions) {
    const key = format(new Date(s.startTime), "yyyy-MM-dd");
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMs);
  }

  let bestDay: WeeklyStats["bestDay"] = null;
  for (const [date, durationMs] of byDay) {
    if (!bestDay || durationMs > bestDay.durationMs) {
      bestDay = { date, durationMs };
    }
  }

  const trackedDays = byDay.size;
  return {
    totalMs,
    dailyAverageMs: trackedDays > 0 ? totalMs / trackedDays : 0,
    bestDay,
    trackedDays,
  };
}

/**
 * Consecutive-day tracking streak ending today (or yesterday, so an untracked
 * "today so far" doesn't reset a real streak). Counts distinct days with any
 * session.
 */
export function calculateStreak(sessions: TimeSession[]): number {
  if (sessions.length === 0) return 0;

  const trackedDays = new Set<string>();
  for (const s of sessions) {
    trackedDays.add(format(new Date(s.startTime), "yyyy-MM-dd"));
  }

  const today = startOfDay(new Date());
  const hasToday = trackedDays.has(format(today, "yyyy-MM-dd"));
  // Anchor on today if tracked, otherwise yesterday — a grace period.
  let cursor = hasToday ? today : subDays(today, 1);
  let streak = 0;

  // Guard the loop to a sane bound.
  for (let i = 0; i < 3650; i++) {
    const key = format(cursor, "yyyy-MM-dd");
    if (trackedDays.has(key)) {
      streak++;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }

  // If we anchored on yesterday and it wasn't tracked, streak is 0.
  if (!hasToday && streak === 0) return 0;
  return streak;
}

export function daysSinceFirstSession(sessions: TimeSession[]): number {
  if (sessions.length === 0) return 0;
  let earliest = new Date(sessions[0].startTime);
  for (const s of sessions) {
    const t = new Date(s.startTime);
    if (t < earliest) earliest = t;
  }
  return differenceInCalendarDays(new Date(), earliest) + 1;
}
