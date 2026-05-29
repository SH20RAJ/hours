import {
  endOfDay,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { TimeSession } from "@/lib/types";

export type WeekStart = 0 | 1;

/** Sessions whose start falls on the given calendar day (local time). */
export function getSessionsForDay(sessions: TimeSession[], date: Date): TimeSession[] {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return sessions.filter((s) => {
    const t = new Date(s.startTime);
    return isWithinInterval(t, { start, end });
  });
}

/** Sessions within the week containing `date`, respecting the week-start setting. */
export function getSessionsForWeek(
  sessions: TimeSession[],
  date: Date,
  weekStartsOn: WeekStart,
): TimeSession[] {
  const start = startOfWeek(date, { weekStartsOn });
  const end = endOfWeek(date, { weekStartsOn });
  return sessions.filter((s) => {
    const t = new Date(s.startTime);
    return isWithinInterval(t, { start, end });
  });
}

/** Sessions within an arbitrary [start, end] window (inclusive). */
export function getSessionsInRange(
  sessions: TimeSession[],
  start: Date,
  end: Date,
): TimeSession[] {
  return sessions.filter((s) => {
    const t = new Date(s.startTime);
    return isWithinInterval(t, { start, end });
  });
}

export function getTotalDuration(sessions: TimeSession[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMs, 0);
}
