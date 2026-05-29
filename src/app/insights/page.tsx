"use client";

import { useMemo } from "react";
import {
  BarChart3,
  Clock,
  CalendarDays,
  Flame,
  Trophy,
  Timer,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { WeeklyHoursChart } from "@/components/charts/weekly-hours-chart";
import { DailyTrendChart } from "@/components/charts/daily-trend-chart";
import { CategoryDot } from "@/components/shared/category-dot";

import { useDataStore } from "@/lib/stores/data-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  getSessionsForDay,
  getSessionsForWeek,
  getTotalDuration,
  getCategoryBreakdown,
  getDailyTrend,
  getWeeklyStats,
  getProductiveVsNegativeTime,
  calculateStreak,
  generateInsights,
} from "@/lib/analytics";
import { startOfMonth } from "date-fns";
import { getSessionsInRange } from "@/lib/analytics";
import { formatDuration, formatHoursLabel, msToHours } from "@/lib/utils";

export default function InsightsPage() {
  const hydrated = useHydrated();
  const sessions = useDataStore((s) => s.sessions);
  const categories = useDataStore((s) => s.categories);
  const goals = useDataStore((s) => s.goals);
  const settings = useDataStore((s) => s.settings);

  const data = useMemo(() => {
    const now = new Date();
    const todaySessions = getSessionsForDay(sessions, now);
    const weekSessions = getSessionsForWeek(sessions, now, settings.weekStartsOn);
    const monthSessions = getSessionsInRange(sessions, startOfMonth(now), now);

    const weeklyStats = getWeeklyStats(weekSessions);
    const trend = getDailyTrend(sessions, 14);
    const weekBars = getDailyTrend(sessions, 7);
    const breakdown = getCategoryBreakdown(sessions, categories);
    const split = getProductiveVsNegativeTime(sessions, categories);
    const streak = calculateStreak(sessions);
    const insights = generateInsights(sessions, categories, goals, settings);

    // Top 5 activities by total time (grouped by name).
    const byActivity = new Map<string, number>();
    for (const s of sessions) {
      byActivity.set(s.activityName, (byActivity.get(s.activityName) ?? 0) + s.durationMs);
    }
    const topActivities = [...byActivity.entries()]
      .map(([name, ms]) => ({ name, ms }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 5);

    // Longest single session.
    const longest = sessions.reduce<(typeof sessions)[number] | null>(
      (max, s) => (!max || s.durationMs > max.durationMs ? s : max),
      null,
    );

    return {
      todayTotal: getTotalDuration(todaySessions),
      weekTotal: getTotalDuration(weekSessions),
      monthTotal: getTotalDuration(monthSessions),
      weeklyStats,
      trend,
      weekBars,
      breakdown,
      split,
      streak,
      insights,
      topActivities,
      longest,
      avgDaily: weeklyStats.dailyAverageMs,
    };
  }, [sessions, categories, goals, settings]);

  if (!hydrated) return <InsightsSkeleton />;

  if (sessions.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <EmptyState
          icon={BarChart3}
          title="No insights yet"
          description="Track a few sessions and this page will fill with charts, trends, and patterns about how you spend your time."
        />
      </div>
    );
  }

  const productiveTotal =
    data.split.positiveMs + data.split.neutralMs + data.split.negativeMs;

  return (
    <div className="space-y-5">
      <PageHeader />

      {/* Top-line stats */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Today" value={formatHoursLabel(data.todayTotal)} icon={Clock} />
        <StatCard label="This week" value={formatHoursLabel(data.weekTotal)} icon={CalendarDays} />
        <StatCard label="This month" value={formatHoursLabel(data.monthTotal)} icon={CalendarDays} />
        <StatCard
          label="Daily average"
          value={formatHoursLabel(data.avgDaily)}
          sublabel="tracked days"
          icon={Timer}
        />
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Where your time goes</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart
              data={data.breakdown}
              total={formatHoursLabel(getTotalDuration(sessions))}
            />
            <div className="mt-3 space-y-1.5">
              {data.breakdown.slice(0, 5).map((b) => (
                <div key={b.category.id} className="flex items-center gap-2 text-sm">
                  <CategoryDot color={b.category.color} />
                  <span className="flex-1 truncate">{b.category.name}</span>
                  <span className="tabular text-muted-foreground">
                    {Math.round(b.percentage)}%
                  </span>
                  <span className="tabular w-14 text-right font-medium">
                    {formatDuration(b.durationMs)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyHoursChart data={data.weekBars} />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Best day</p>
                <p className="mt-0.5 font-semibold">
                  {data.weeklyStats.bestDay
                    ? formatDuration(data.weeklyStats.bestDay.durationMs)
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="mt-0.5 flex items-center gap-1 font-semibold">
                  <Flame className="h-4 w-4 text-orange-400" />
                  {data.streak} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Daily trend */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Daily trend</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyTrendChart data={data.trend} />
        </CardContent>
      </Card>

      {/* Productive vs consuming */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Building vs consuming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="bg-success"
              style={{ width: `${data.split.positivePct}%` }}
            />
            <div
              className="bg-muted-foreground/40"
              style={{ width: `${data.split.neutralPct}%` }}
            />
            <div
              className="bg-destructive"
              style={{ width: `${data.split.negativePct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Legend
              icon={TrendingUp}
              label="Building"
              value={formatDuration(data.split.positiveMs)}
              pct={data.split.positivePct}
              className="text-success"
            />
            <Legend
              label="Neutral"
              value={formatDuration(data.split.neutralMs)}
              pct={data.split.neutralPct}
              className="text-muted-foreground"
            />
            <Legend
              icon={TrendingDown}
              label="Consuming"
              value={formatDuration(data.split.negativeMs)}
              pct={data.split.negativePct}
              className="text-destructive"
            />
          </div>
          {productiveTotal > 0 && data.split.negativeMs > 0 && (
            <p className="text-sm text-muted-foreground">
              You spent{" "}
              <span className="font-medium text-foreground">
                {(data.split.positiveMs / Math.max(data.split.negativeMs, 1)).toFixed(1)}x
              </span>{" "}
              more time building than consuming.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top activities + records */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.topActivities.map((a, i) => {
              const max = data.topActivities[0]?.ms || 1;
              return (
                <div key={a.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      <span className="tabular mr-2 text-muted-foreground">
                        {i + 1}
                      </span>
                      {a.name}
                    </span>
                    <span className="tabular font-medium">{formatDuration(a.ms)}</span>
                  </div>
                  <Progress value={(a.ms / max) * 100} size="sm" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecordRow
              icon={Trophy}
              label="Most tracked category"
              value={data.breakdown[0]?.category.name ?? "—"}
              sub={
                data.breakdown[0]
                  ? formatDuration(data.breakdown[0].durationMs)
                  : undefined
              }
            />
            <RecordRow
              icon={Timer}
              label="Longest session"
              value={data.longest ? formatDuration(data.longest.durationMs) : "—"}
              sub={data.longest?.activityName}
            />
            <RecordRow
              icon={CalendarDays}
              label="Total tracked"
              value={`${msToHours(getTotalDuration(sessions)).toFixed(1)}h`}
              sub={`${sessions.length} sessions`}
            />
          </CardContent>
        </Card>
      </section>

      {/* Insights */}
      {data.insights.length > 0 && (
        <section>
          <h2 className="mb-2.5 flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            What we noticed
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {data.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <header>
      <h1 className="hidden text-2xl font-bold tracking-tight lg:block">Insights</h1>
      <p className="text-sm text-muted-foreground lg:mt-0.5">
        Patterns and trends from your tracked time.
      </p>
    </header>
  );
}

function Legend({
  icon: Icon,
  label,
  value,
  pct,
  className,
}: {
  icon?: typeof TrendingUp;
  label: string;
  value: string;
  pct: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className={`flex items-center gap-1 text-xs font-medium ${className}`}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="tabular mt-1 font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{Math.round(pct)}%</p>
    </div>
  );
}

function RecordRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
      {sub && (
        <span className="truncate text-right text-xs text-muted-foreground">
          {sub}
        </span>
      )}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
