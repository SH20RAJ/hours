"use client";

import { useMemo, useState } from "react";
import { Target, Plus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalDialog } from "@/components/goals/goal-dialog";

import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { calculateGoalProgress } from "@/lib/analytics";
import type { Goal } from "@/lib/types";

export default function GoalsPage() {
  const hydrated = useHydrated();
  const sessions = useDataStore((s) => s.sessions);
  const categories = useDataStore((s) => s.categories);
  const goals = useDataStore((s) => s.goals);
  const settings = useDataStore((s) => s.settings);
  const getCategory = useDataStore((s) => s.getCategory);
  const deleteGoal = useDataStore((s) => s.deleteGoal);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  const progresses = useMemo(
    () =>
      goals.map((g) =>
        calculateGoalProgress(g, sessions, categories, settings.weekStartsOn),
      ),
    [goals, sessions, categories, settings.weekStartsOn],
  );

  // Active (in-progress) sort first, then at-risk surfaced, completed last.
  const active = progresses.filter((p) => !p.isComplete);
  const completed = progresses.filter((p) => p.isComplete);
  active.sort((a, b) => Number(b.atRisk) - Number(a.atRisk));

  if (!hydrated) return <GoalsSkeleton />;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="hidden text-2xl font-bold tracking-tight lg:block">Goals</h1>
          <p className="text-sm text-muted-foreground lg:mt-0.5">
            Turn intentions into tracked progress.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditGoal(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New goal</span>
          <span className="sm:hidden">New</span>
        </Button>
      </header>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a target like “Code 20 hours a week” or “Keep Social Media under 5 hours” and watch your progress build."
          action={
            <Button
              onClick={() => {
                setEditGoal(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create your first goal
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section className="space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {active.map((p) => (
                  <GoalCard
                    key={p.goal.id}
                    progress={p}
                    category={p.goal.categoryId ? getCategory(p.goal.categoryId) : undefined}
                    onEdit={() => {
                      setEditGoal(p.goal);
                      setDialogOpen(true);
                    }}
                    onDelete={() => setDeleteTarget(p.goal)}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Completed
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {completed.map((p) => (
                  <GoalCard
                    key={p.goal.id}
                    progress={p}
                    category={p.goal.categoryId ? getCategory(p.goal.categoryId) : undefined}
                    onEdit={() => {
                      setEditGoal(p.goal);
                      setDialogOpen(true);
                    }}
                    onDelete={() => setDeleteTarget(p.goal)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editGoal} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this goal?"
        description="This removes the goal and its tracking. Your sessions stay untouched."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteGoal(deleteTarget.id);
            toast({ title: "Goal deleted" });
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
