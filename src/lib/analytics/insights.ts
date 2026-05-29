import { subDays, startOfDay } from "date-fns";
import type {
  AppSettings,
  Category,
  Goal,
  Insight,
  TimeSession,
} from "@/lib/types";
import { formatDuration, msToHours, round } from "@/lib/utils";
import {
  getCategoryBreakdown,
  getIdentityBreakdown,
  getProductiveVsNegativeTime,
  calculateStreak,
} from "./breakdowns";
import { getSessionsForDay, getSessionsInRange, getTotalDuration } from "./time";
import { calculateGoalProgress } from "./goals";

/**
 * Produce a short list of human, encouraging insights from the current data.
 * Each rule only fires when it has something real to say, so we never show
 * filler. Order is roughly most-actionable first.
 */
export function generateInsights(
  sessions: TimeSession[],
  categories: Category[],
  goals: Goal[],
  settings: AppSettings,
): Insight[] {
  const insights: Insight[] = [];
  const today = new Date();

  // Empty state — gentle nudge to begin.
  if (sessions.length === 0) {
    return [
      {
        id: "empty",
        tone: "neutral",
        title: "Start with one focused hour",
        body: "Track a single session today and Hours will start showing you where your time really goes.",
      },
    ];
  }

  const todaySessions = getSessionsForDay(sessions, today);
  const todayTotal = getTotalDuration(todaySessions);

  if (todaySessions.length === 0) {
    insights.push({
      id: "no-today",
      tone: "neutral",
      title: "Nothing tracked yet today",
      body: "Start a focus session to keep your streak alive and see today take shape.",
    });
  } else {
    const breakdown = getCategoryBreakdown(todaySessions, categories);
    const top = breakdown[0];
    if (top) {
      const identity = getIdentityBreakdown(todaySessions, categories)[0];
      insights.push({
        id: "lived-as",
        tone: "positive",
        title: `You lived mostly as a ${identity?.identity ?? top.category.name} today`,
        body: `${formatDuration(top.durationMs)} on ${top.category.name} — your biggest block so far.`,
      });
    }
  }

  // Productive vs consuming.
  const last7 = getSessionsInRange(sessions, startOfDay(subDays(today, 6)), today);
  const split = getProductiveVsNegativeTime(last7, categories);
  if (split.negativeMs > 0 && split.positiveMs > 0) {
    const ratio = split.positiveMs / split.negativeMs;
    if (split.negativePct >= 30) {
      insights.push({
        id: "consuming",
        tone: "warning",
        title: "Consumer time is climbing",
        body: `About ${round(split.negativePct)}% of this week went into low-value activities. A small trim frees real hours.`,
      });
    } else if (ratio >= 2) {
      insights.push({
        id: "building",
        tone: "positive",
        title: "You're building more than consuming",
        body: `You spent ${ratio.toFixed(1)}x more time building than consuming this week. Keep the momentum.`,
      });
    }
  }

  // Founder / startup trend: this week vs last week.
  const startupCat = categories.find((c) => c.identity === "Founder");
  if (startupCat) {
    const thisWeek = getSessionsInRange(sessions, startOfDay(subDays(today, 6)), today)
      .filter((s) => s.categoryId === startupCat.id);
    const prevWeek = getSessionsInRange(
      sessions,
      startOfDay(subDays(today, 13)),
      startOfDay(subDays(today, 7)),
    ).filter((s) => s.categoryId === startupCat.id);
    const thisMs = getTotalDuration(thisWeek);
    const prevMs = getTotalDuration(prevWeek);
    if (prevMs > 0 && thisMs > prevMs * 1.15) {
      insights.push({
        id: "founder-up",
        tone: "positive",
        title: "Founder time is trending up",
        body: `You put ${formatDuration(thisMs)} into building this week, up from ${formatDuration(prevMs)} last week.`,
      });
    } else if (prevMs > 0 && thisMs < prevMs * 0.85) {
      const drop = round((1 - thisMs / prevMs) * 100);
      insights.push({
        id: "founder-down",
        tone: "warning",
        title: "Founder time dropped",
        body: `Your building time fell ${drop}% from last week. Worth protecting a block for it.`,
      });
    }
  }

  // Goal nudges.
  for (const goal of goals.filter((g) => g.isActive)) {
    const progress = calculateGoalProgress(goal, sessions, categories, settings.weekStartsOn);
    if (goal.type !== "negative_limit" && progress.percentage >= 80 && !progress.isComplete) {
      insights.push({
        id: `goal-close-${goal.id}`,
        tone: "positive",
        title: `Almost there: ${goal.title}`,
        body: `You're ${round(progress.percentage)}% of the way to this goal. One more push.`,
      });
    } else if (goal.type === "negative_limit" && progress.atRisk) {
      insights.push({
        id: `goal-risk-${goal.id}`,
        tone: "warning",
        title: `Close to your limit: ${goal.title}`,
        body: `${progress.label}. Ease off to stay under budget this ${goal.period.replace("ly", "")}.`,
      });
    }
  }

  // Streak.
  const streak = calculateStreak(sessions);
  if (streak >= 3) {
    insights.push({
      id: "streak",
      tone: "positive",
      title: `${streak}-day tracking streak`,
      body: `You've logged time ${streak} days in a row. Consistency is the whole game.`,
    });
  }

  // Daily target.
  if (todayTotal > 0 && settings.dailyTargetHours > 0) {
    const targetMs = settings.dailyTargetHours * 60 * 60 * 1000;
    if (todayTotal >= targetMs) {
      insights.push({
        id: "target-hit",
        tone: "positive",
        title: "Daily target reached",
        body: `You've hit your ${settings.dailyTargetHours}h goal for today. Anything more is a bonus.`,
      });
    }
  }

  return insights.slice(0, 6);
}

/** A single-line weekly summary string for the review card. */
export function weeklySummaryLine(
  sessions: TimeSession[],
  categories: Category[],
): string {
  const identities = getIdentityBreakdown(sessions, categories);
  if (identities.length === 0) {
    return "No time tracked this week yet — a fresh start is waiting.";
  }
  const parts = identities
    .slice(0, 3)
    .map((i) => `${round(i.percentage)}% as a ${i.identity}`);
  const total = getTotalDuration(sessions);
  return `This week you tracked ${msToHours(total).toFixed(1)}h — living ${parts.join(", ")}.`;
}
