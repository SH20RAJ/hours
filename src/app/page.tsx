"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Play, Clock, Flame, TrendingUp, Plus, Trophy } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { ActiveTimerCard } from "@/components/timer/active-timer-card";
import { StartSessionSheet } from "@/components/timer/start-session-sheet";
import { ManualEntryDialog } from "@/components/timer/manual-entry-dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickStartGrid } from "@/components/dashboard/quick-start-grid";
import { SessionCard } from "@/components/dashboard/session-card";
import { IdentityScoreRing } from "@/components/dashboard/identity-score-ring";

import { useDataStore } from "@/lib/stores/data-store";
import { useTimerStore } from "@/lib/stores/timer-store";
import { toast } from "@/lib/stores/ui-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  getSessionsForDay,
  getTotalDuration,
  getCategoryBreakdown,
  getIdentityBreakdown,
  calculateStreak,
  calculateFutureSelfAlignment,
} from "@/lib/analytics";
import { formatDuration, msToHours, clamp } from "@/lib/utils";
import type { TimeSession } from "@/lib/types";

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Winding down";
}

export default function TodayPage() {
  const hydrated = useHydrated();
  const sessions = useDataStore((s) => s.sessions);
  const categories = useDataStore((s) => s.categories);
  const settings = useDataStore((s) => s.settings);
  const getCategory = useDataStore((s) => s.getCategory);
  const deleteSession = useDataStore((s) => s.deleteSession);
  const timer = useTimerStore((s) => s.timer);

  const [startOpen, setStartOpen] = useState(false);
  const [startPreset, setStartPreset] = useState<{ categoryId?: string; activity?: string }>({});
  const [manualOpen, setManualOpen] = useState(false);
  const [editSession, setEditSession] = useState<TimeSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeSession | null>(null);

  const now = useMemo(() => new Date(), []);

  const today = useMemo(() => {
    const todaySessions = getSessionsForDay(sessions, now);
    const total = getTotalDuration(todaySessions);
    const catBreakdown = getCategoryBreakdown(todaySessions, categories);
    const identityBreakdown = getIdentityBreakdown(todaySessions, categories);
    const allIdentity = getIdentityBreakdown(sessions, categories);
    const alignment = calculateFutureSelfAlignment(
      allIdentity,
      settings.desiredIdentities,
    );
    const streak = calculateStreak(sessions);
    const targetMs = settings.dailyTargetHours * 60 * 60 * 1000;
    return {
      todaySessions,
      total,
      topCategory: catBreakdown[0],
      topIdentity: identityBreakdown[0],
      alignment,
      streak,
      targetMs,
      goalPct: targetMs > 0 ? clamp((total / targetMs) * 100, 0, 100) : 0,
    };
  }, [sessions, categories, settings, now]);

  function quickStart(categoryId: string, activity?: string) {
    if (timer) {
      toast({
        title: "A timer is already running",
        description: "Finish or discard it first.",
        variant: "error",
      });
      return;
    }
    setStartPreset({ categoryId, activity });
    setStartOpen(true);
  }

  function openFreshStart() {
    const lastCategory = sessions[0]?.categoryId;
    setStartPreset({ categoryId: lastCategory });
    setStartOpen(true);
  }

  if (!hydrated) return <TodaySkeleton />;

  const recent = today.todaySessions.slice(0, 5);
  const hasAnyData = sessions.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(now, "EEEE, MMMM d")}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting(now)}
          </h1>
        </div>
        {today.streak > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1.5 text-sm font-medium text-orange-400">
            <Flame className="h-4 w-4" />
            {today.streak} day{today.streak > 1 ? "s" : ""}
          </span>
        )}
      </header>

      {/* Active timer OR start CTA */}
      {timer ? (
        <ActiveTimerCard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div>
                <h2 className="text-lg font-semibold">Ready to focus?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start the clock and watch your hours add up.
                </p>
              </div>
              <Button size="xl" className="w-full sm:w-auto" onClick={openFreshStart}>
                <Play className="h-5 w-5" />
                Start Focus Session
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick start */}
      <section>
        <h2 className="mb-2.5 px-1 text-sm font-medium text-muted-foreground">
          Quick start
        </h2>
        <QuickStartGrid onQuickStart={quickStart} />
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Tracked today"
          value={formatDuration(today.total)}
          sublabel={`${today.todaySessions.length} session${today.todaySessions.length === 1 ? "" : "s"}`}
          icon={Clock}
        />
        <StatCard
          label="Top focus"
          value={today.topCategory?.category.name ?? "—"}
          sublabel={
            today.topCategory
              ? formatDuration(today.topCategory.durationMs)
              : "Nothing yet"
          }
          icon={TrendingUp}
          accent={today.topCategory?.category.color ? undefined : undefined}
        />
        <StatCard
          label="Alignment"
          value={`${Math.round(today.alignment)}`}
          sublabel="Future-self score"
          icon={Trophy}
        />
        <StatCard
          label="Streak"
          value={today.streak}
          sublabel="days in a row"
          icon={Flame}
        />
      </section>

      {/* Daily goal + identity ring */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daily goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="tabular text-2xl font-bold">
                {msToHours(today.total).toFixed(1)}
                <span className="text-base font-medium text-muted-foreground">
                  {" "}
                  / {settings.dailyTargetHours}h
                </span>
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(today.goalPct)}%
              </span>
            </div>
            <Progress value={today.goalPct} size="lg" />
            <p className="text-sm text-muted-foreground">
              {today.goalPct >= 100
                ? "You've hit your target for today. Anything more is a bonus."
                : today.total === 0
                  ? "Track your first session to start the day."
                  : `${formatDuration(today.targetMs - today.total)} to go to reach your target.`}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-5">
          <IdentityScoreRing
            score={today.alignment}
            label="Alignment"
            sublabel={
              today.topIdentity
                ? `Mostly ${today.topIdentity.identity} today`
                : "Track to see your mix"
            }
          />
        </Card>
      </section>

      {/* Recent sessions */}
      <section>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-muted-foreground">Today</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditSession(null);
              setManualOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add manually
          </Button>
        </div>

        {recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                category={getCategory(s.categoryId)}
                onEdit={(sess) => {
                  setEditSession(sess);
                  setManualOpen(true);
                }}
                onDelete={(sess) => setDeleteTarget(sess)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title={hasAnyData ? "Nothing tracked today" : "Welcome to Hours"}
            description={
              hasAnyData
                ? "Start a session or add one manually to fill in your day."
                : "Start your first focus session and watch your life add up, one hour at a time."
            }
            action={
              <Button onClick={openFreshStart}>
                <Play className="h-4 w-4" />
                Start tracking
              </Button>
            }
          />
        )}
      </section>

      {/* Dialogs */}
      <StartSessionSheet
        open={startOpen}
        onOpenChange={setStartOpen}
        defaultCategoryId={startPreset.categoryId}
        defaultActivity={startPreset.activity}
      />
      <ManualEntryDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        session={editSession}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this session?"
        description="This permanently removes the tracked time. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSession(deleteTarget.id);
            toast({ title: "Session deleted" });
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
