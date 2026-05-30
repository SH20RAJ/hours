"use client";

import { useState } from "react";
import { CalendarCheck, Plus, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitDialog } from "@/components/habits/habit-dialog";

import { useHabitsStore } from "@/lib/stores/habits-store";
import { toast } from "@/lib/stores/ui-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { calculateHabitStats } from "@/lib/analytics/habits";
import type { Habit } from "@/lib/types";

export default function HabitsPage() {
  const baseHydrated = useHydrated();
  const habits = useHabitsStore((s) => s.habits);
  const entries = useHabitsStore((s) => s.entries);
  const habitsHydrated = useHabitsStore((s) => s.hydrated);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);

  const ready = baseHydrated && habitsHydrated;

  // Headline: how many habits are completed today.
  const doneToday = ready
    ? habits.filter((h) => calculateHabitStats(h, entries).completedToday).length
    : 0;

  if (!ready) return <HabitsSkeleton />;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="hidden text-2xl font-bold tracking-tight lg:block">Habits</h1>
          <p className="text-sm text-muted-foreground lg:mt-0.5">
            {habits.length > 0
              ? `${doneToday} of ${habits.length} done today`
              : "Build streaks that compound."}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditHabit(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New habit</span>
          <span className="sm:hidden">New</span>
        </Button>
      </header>

      {habits.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Start your first habit"
          description="Pick something small you want to do daily — a walk, reading, 20 push-ups. Each day you complete fills a square and grows your streak."
          action={
            <Button
              onClick={() => {
                setEditHabit(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create a habit
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              entries={entries}
              onEdit={(h) => {
                setEditHabit(h);
                setDialogOpen(true);
              }}
              onDelete={(h) => setDeleteTarget(h)}
            />
          ))}
        </div>
      )}

      {habits.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          Tap a day in any grid to fill or clear it.
        </p>
      )}

      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editHabit} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This removes the habit and its entire history. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await useHabitsStore.getState().deleteHabit(deleteTarget.id);
            toast({ title: "Habit deleted" });
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

function HabitsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
