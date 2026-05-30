export type Tone = "positive" | "neutral" | "negative";

export type TimerStatus = "running" | "paused";

export type SessionSource = "timer" | "manual";

export type GoalType =
  | "category_hours"
  | "identity_percentage"
  | "negative_limit"
  | "total_hours";

export type GoalPeriod = "daily" | "weekly" | "monthly";

export type ThemePreference = "light" | "dark" | "system";

export interface TimeSession {
  id: string;
  activityName: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  notes?: string;
  tags: string[];
  source: SessionSource;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  identity: string;
  color: string;
  tone: Tone;
  createdAt: string;
  updatedAt: string;
}

export interface DesiredIdentity {
  identity: string;
  targetPercentage: number;
}

export interface AppSettings {
  id: string;
  dailyTargetHours: number;
  weekStartsOn: 0 | 1;
  desiredIdentities: DesiredIdentity[];
  theme: ThemePreference;
}

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  categoryId?: string;
  identity?: string;
  createdAt: string;
  isActive: boolean;
}

export interface TimerState {
  id: string;
  activityName: string;
  categoryId: string;
  startedAt: string;
  pausedAt?: string | null;
  totalPausedMs: number;
  status: TimerStatus;
  notes?: string;
  tags: string[];
}

export interface CategoryBreakdownItem {
  category: Category;
  durationMs: number;
  percentage: number;
}

export interface IdentityBreakdownItem {
  identity: string;
  durationMs: number;
  percentage: number;
  color: string;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  durationMs: number;
  hours: number;
}

export interface WeeklyStats {
  totalMs: number;
  dailyAverageMs: number;
  bestDay: { date: string; durationMs: number } | null;
  trackedDays: number;
}

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isComplete: boolean;
  atRisk: boolean;
  label: string;
  unit: string;
}

export interface Insight {
  id: string;
  tone: "positive" | "neutral" | "warning";
  title: string;
  body: string;
}

export interface ProductiveSplit {
  positiveMs: number;
  neutralMs: number;
  negativeMs: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  sessions: TimeSession[];
  categories: Category[];
  goals: Goal[];
  settings: AppSettings | null;
  habits?: Habit[];
  habitEntries?: HabitEntry[];
}

// ---------------------------------------------------------------------------
// Habits — GitHub-style daily streak tracking, independent of time sessions.
// ---------------------------------------------------------------------------

export interface Habit {
  id: string;
  name: string;
  description?: string;
  /** Lucide icon name (e.g. "Dumbbell"); falls back to a default if unknown. */
  icon: string;
  color: string;
  /** Completions per day needed to count the day "done" (>=1). */
  targetPerDay: number;
  archived: boolean;
  /** Manual ordering on the Habits screen. */
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** One day's progress for a habit. `date` is a local YYYY-MM-DD key. */
export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitDay {
  date: string;
  count: number;
  /** 0 = none, 1-4 intensity buckets relative to the habit's target. */
  level: 0 | 1 | 2 | 3 | 4;
  complete: boolean;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  /** Completed days ÷ days since the habit was created (0-100). */
  completionRate: number;
  completedToday: boolean;
  todayCount: number;
}
