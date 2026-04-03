import type { Cadence } from '@/types/tasks';

const SECOND = 1000;

export function nowIso(date = new Date()) {
  return date.toISOString();
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const rem = safe % 60;

  if (hours > 0) {
    return `${hours}h ${rem}m`;
  }

  return `${rem}m`;
}

export function getCadenceWindow(cadence: Cadence, now = new Date()) {
  const start = new Date(now);

  if (cadence === 'free') {
    return {
      start: new Date(0),
      end: new Date(8640000000000000),
    };
  }

  if (cadence === 'daily') {
    start.setHours(0, 0, 0, 0);
  }

  if (cadence === 'weekly') {
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  }

  if (cadence === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    start,
    end: now,
  };
}

export function getSecondsBetween(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.floor((end - start) / SECOND));
}

export function overlapsWindow(startIso: string, endIso: string, windowStart: Date, windowEnd: Date) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return start <= windowEnd.getTime() && end >= windowStart.getTime();
}
