import type { Category, AppSettings } from "@/lib/types";

export const DB_NAME = "hours-db";
export const DB_VERSION = 1;
export const SETTINGS_ID = "app-settings";
export const ACTIVE_TIMER_ID = "active-timer";
export const DATA_VERSION = 1;

/**
 * Category color palette. Each token maps to a fixed hue so charts, rings, and
 * badges stay visually consistent regardless of theme. Values are picked to read
 * well on a dark background while staying legible in light mode.
 */
export const CATEGORY_COLORS: Record<
  string,
  { label: string; hex: string; soft: string }
> = {
  blue: { label: "Blue", hex: "#3b82f6", soft: "rgba(59,130,246,0.16)" },
  purple: { label: "Purple", hex: "#a855f7", soft: "rgba(168,85,247,0.16)" },
  green: { label: "Green", hex: "#22c55e", soft: "rgba(34,197,94,0.16)" },
  orange: { label: "Orange", hex: "#f97316", soft: "rgba(249,115,22,0.16)" },
  yellow: { label: "Yellow", hex: "#eab308", soft: "rgba(234,179,8,0.16)" },
  pink: { label: "Pink", hex: "#ec4899", soft: "rgba(236,72,153,0.16)" },
  cyan: { label: "Cyan", hex: "#06b6d4", soft: "rgba(6,182,212,0.16)" },
  red: { label: "Red", hex: "#ef4444", soft: "rgba(239,68,68,0.16)" },
  gray: { label: "Gray", hex: "#6b7280", soft: "rgba(107,114,128,0.16)" },
  indigo: { label: "Indigo", hex: "#6366f1", soft: "rgba(99,102,241,0.16)" },
  teal: { label: "Teal", hex: "#14b8a6", soft: "rgba(20,184,166,0.16)" },
  rose: { label: "Rose", hex: "#f43f5e", soft: "rgba(244,63,94,0.16)" },
};

export const COLOR_KEYS = Object.keys(CATEGORY_COLORS);

export function colorHex(color: string): string {
  return CATEGORY_COLORS[color]?.hex ?? CATEGORY_COLORS.gray.hex;
}

export function colorSoft(color: string): string {
  return CATEGORY_COLORS[color]?.soft ?? CATEGORY_COLORS.gray.soft;
}

/**
 * Default categories seeded on first run. Tones drive the productive-vs-consuming
 * analytics: positive = building you up, negative = time leaks, neutral = rest.
 */
export const DEFAULT_CATEGORIES: Array<
  Pick<Category, "name" | "identity" | "color" | "tone">
> = [
  { name: "Coding", identity: "Developer", color: "blue", tone: "positive" },
  { name: "Startup", identity: "Founder", color: "purple", tone: "positive" },
  { name: "Learning", identity: "Learner", color: "green", tone: "positive" },
  { name: "Fitness", identity: "Athlete", color: "orange", tone: "positive" },
  { name: "Reading", identity: "Thinker", color: "yellow", tone: "positive" },
  { name: "Content", identity: "Creator", color: "pink", tone: "positive" },
  { name: "Deep Work", identity: "Builder", color: "cyan", tone: "positive" },
  { name: "Social Media", identity: "Consumer", color: "red", tone: "negative" },
  { name: "Entertainment", identity: "Consumer", color: "gray", tone: "neutral" },
  { name: "Sleep", identity: "Recovered", color: "indigo", tone: "neutral" },
];

export const DEFAULT_SETTINGS: Omit<AppSettings, "id"> = {
  dailyTargetHours: 6,
  weekStartsOn: 1,
  desiredIdentities: [
    { identity: "Developer", targetPercentage: 35 },
    { identity: "Founder", targetPercentage: 25 },
    { identity: "Learner", targetPercentage: 20 },
    { identity: "Athlete", targetPercentage: 12 },
    { identity: "Thinker", targetPercentage: 8 },
  ],
  theme: "dark",
};

/** Quick-start activities surfaced on the Today screen for one-tap tracking. */
export const QUICK_ACTIONS: Array<{ label: string; categoryName: string }> = [
  { label: "Code", categoryName: "Coding" },
  { label: "Startup", categoryName: "Startup" },
  { label: "Learn", categoryName: "Learning" },
  { label: "Workout", categoryName: "Fitness" },
  { label: "Read", categoryName: "Reading" },
  { label: "Deep Work", categoryName: "Deep Work" },
];
