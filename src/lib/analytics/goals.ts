import { startOfDay, startOfMonth, startOfWeek } from "date-fns";
import type {
  Category,
  DesiredIdentity,
  Goal,
  GoalProgress,
  IdentityBreakdownItem,
  TimeSession,
} from "@/lib/types";
import { clamp, msToHours, round } from "@/lib/utils";
import { getIdentityBreakdown } from "./breakdowns";
import { getSessionsInRange, getTotalDuration } from "./time";

type WeekStart = 0 | 1;

/** Sessions inside the goal's current period window (day/week/month to now). */
function sessionsForPeriod(
  sessions: TimeSession[],
  period: Goal["period"],
  weekStartsOn: WeekStart,
): TimeSession[] {
  const now = new Date();
  let start: Date;
  if (period === "daily") start = startOfDay(now);
  else if (period === "weekly") start = startOfWeek(now, { weekStartsOn });
  else start = startOfMonth(now);
  return getSessionsInRange(sessions, start, now);
}

/**
 * Compute progress for a single goal. Handles all four goal types. For
 * negative-limit goals, "progress" is how much of the budget is used, and the
 * goal is at risk as it approaches the cap.
 */
export function calculateGoalProgress(
  goal: Goal,
  sessions: TimeSession[],
  categories: Category[],
  weekStartsOn: WeekStart = 1,
): GoalProgress {
  const periodSessions = sessionsForPeriod(sessions, goal.period, weekStartsOn);

  if (goal.type === "category_hours" || goal.type === "negative_limit") {
    const relevant = goal.categoryId
      ? periodSessions.filter((s) => s.categoryId === goal.categoryId)
      : periodSessions;
    const currentHours = round(msToHours(getTotalDuration(relevant)), 1);
    const pct = goal.targetValue > 0 ? (currentHours / goal.targetValue) * 100 : 0;

    if (goal.type === "negative_limit") {
      // Staying under the cap is success.
      const isComplete = currentHours <= goal.targetValue;
      return {
        goal,
        currentValue: currentHours,
        targetValue: goal.targetValue,
        percentage: clamp(round(pct), 0, 100),
        isComplete,
        atRisk: pct >= 80 && pct < 100,
        label: `${currentHours}h of ${goal.targetValue}h limit`,
        unit: "h",
      };
    }

    return {
      goal,
      currentValue: currentHours,
      targetValue: goal.targetValue,
      percentage: clamp(round(pct), 0, 100),
      isComplete: currentHours >= goal.targetValue,
      atRisk: false,
      label: `${currentHours}h of ${goal.targetValue}h`,
      unit: "h",
    };
  }

  if (goal.type === "total_hours") {
    const currentHours = round(msToHours(getTotalDuration(periodSessions)), 1);
    const pct = goal.targetValue > 0 ? (currentHours / goal.targetValue) * 100 : 0;
    return {
      goal,
      currentValue: currentHours,
      targetValue: goal.targetValue,
      percentage: clamp(round(pct), 0, 100),
      isComplete: currentHours >= goal.targetValue,
      atRisk: false,
      label: `${currentHours}h of ${goal.targetValue}h tracked`,
      unit: "h",
    };
  }

  // identity_percentage
  const breakdown = getIdentityBreakdown(periodSessions, categories);
  const match = breakdown.find((b) => b.identity === goal.identity);
  const currentPct = round(match?.percentage ?? 0, 0);
  const pct = goal.targetValue > 0 ? (currentPct / goal.targetValue) * 100 : 0;
  return {
    goal,
    currentValue: currentPct,
    targetValue: goal.targetValue,
    percentage: clamp(round(pct), 0, 100),
    isComplete: currentPct >= goal.targetValue,
    atRisk: false,
    label: `${currentPct}% of ${goal.targetValue}% target`,
    unit: "%",
  };
}

/**
 * Future Self Alignment Score (0-100). Compares the actual identity mix against
 * the user's desired mix using total absolute deviation. A perfect match scores
 * 100; the score falls as the distributions diverge. We normalize the total
 * deviation (which ranges 0-200 across two distributions) into a 0-100 score.
 */
export function calculateFutureSelfAlignment(
  actual: IdentityBreakdownItem[],
  desired: DesiredIdentity[],
): number {
  if (desired.length === 0) return 0;

  const actualMap = new Map<string, number>();
  for (const item of actual) actualMap.set(item.identity, item.percentage);

  // Normalize desired to sum to 100 so partial configs still compare fairly.
  const desiredTotal = desired.reduce((sum, d) => sum + d.targetPercentage, 0);
  if (desiredTotal === 0) return 0;

  const identities = new Set<string>([
    ...desired.map((d) => d.identity),
    ...actual.map((a) => a.identity),
  ]);

  let totalDeviation = 0;
  for (const identity of identities) {
    const desiredPct =
      ((desired.find((d) => d.identity === identity)?.targetPercentage ?? 0) /
        desiredTotal) *
      100;
    const actualPct = actualMap.get(identity) ?? 0;
    totalDeviation += Math.abs(desiredPct - actualPct);
  }

  // Max possible deviation between two normalized distributions is 200.
  const score = 100 - (totalDeviation / 200) * 100;
  return clamp(round(score), 0, 100);
}
