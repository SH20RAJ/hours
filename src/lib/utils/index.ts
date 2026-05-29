import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Stable id generator that works in any browser without extra deps. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

const HOUR_MS = 1000 * 60 * 60;
const MINUTE_MS = 1000 * 60;

/** "2h 14m" style compact label. Used in cards and lists. */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Decimal hours, e.g. 2.4 — used in analytics copy and goals. */
export function msToHours(ms: number): number {
  return ms / HOUR_MS;
}

export function hoursToMs(hours: number): number {
  return hours * HOUR_MS;
}

/** "01:23:45" stopwatch label for the live timer. */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatHoursLabel(ms: number): string {
  const hours = msToHours(ms);
  if (hours < 0.1) return "0h";
  return `${hours.toFixed(1)}h`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Convert a datetime-local input value to an ISO string. */
export function localInputToIso(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Convert an ISO string to a datetime-local input value (local timezone). */
export function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * MINUTE_MS;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
