"use client";

import { useMemo, useState } from "react";
import { Check, Flame, Trophy, MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { colorHex, colorSoft } from "@/lib/constants";
import { useHabitsStore } from "@/lib/stores/habits-store";
import { useDataStore } from "@/lib/stores/data-store";
import { buildHabitDays, calculateHabitStats } from "@/lib/analytics/habits";
import { ContributionGraph } from "./contribution-graph";
import { habitIcon } from "./habit-icons";
import type { Habit, HabitEntry } from "@/lib/types";

interface HabitCardProps {
  habit: Habit;
  entries: HabitEntry[];
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

/**
 * A single habit: identity row, a one-tap "done today" control, the GitHub-style
 * grid, and streak stats. Tapping a grid day toggles that day too, so back-filling
 * a missed day is one click.
 */
export function HabitCard({ habit, entries, onEdit, onDelete }: HabitCardProps) {
  const toggleDay = useHabitsStore((s) => s.toggleDay);
  const incrementToday = useHabitsStore((s) => s.incrementToday);
  const weekStartsOn = useDataStore((s) => s.settings.weekStartsOn);
  const [menuOpen, setMenuOpen] = useState(false);

  const { days, stats } = useMemo(() => {
    return {
      days: buildHabitDays(habit, entries, 364),
      stats: calculateHabitStats(habit, entries),
    };
  }, [habit, entries]);

  const hex = colorHex(habit.color);
  const Icon = habitIcon(habit.icon);
  const multiTarget = habit.targetPerDay > 1;

  function handleTodayTap() {
    // Multi-target habits increment; single-target toggles done/undone.
    if (multiTarget) void incrementToday(habit.id);
    else void toggleDay(habit.id, new Date());
  }

  return (
    <Card
      className="overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${colorSoft(habit.color)}, transparent 55%)` }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: hex }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{habit.name}</p>
            {habit.description && (
              <p className="truncate text-xs text-muted-foreground">
                {habit.description}
              </p>
            )}
          </div>

          {/* Today control */}
          <button
            onClick={handleTodayTap}
            aria-label={
              stats.completedToday ? "Mark today not done" : "Mark today done"
            }
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all active:scale-90",
              stats.completedToday
                ? "border-transparent text-white"
                : "border-dashed text-muted-foreground hover:text-foreground",
            )}
            style={{
              backgroundColor: stats.completedToday ? hex : "transparent",
              borderColor: stats.completedToday ? hex : undefined,
            }}
          >
            {multiTarget ? (
              stats.completedToday ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold tabular">
                  {stats.todayCount}/{habit.targetPerDay}
                </span>
              )
            ) : stats.completedToday ? (
              <Check className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>

          {/* Overflow menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Habit actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 z-20 mt-1 w-36 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-2xl">
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-accent"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(habit);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(habit);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contribution grid */}
        <div className="mt-4">
          <ContributionGraph
            days={days}
            color={habit.color}
            weekStartsOn={weekStartsOn}
            onDayClick={(date) => {
              const [y, m, d] = date.split("-").map(Number);
              void toggleDay(habit.id, new Date(y, m - 1, d));
            }}
          />
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="font-semibold tabular">{stats.currentStreak}</span>
            <span className="text-muted-foreground">current</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold tabular">{stats.longestStreak}</span>
            <span className="text-muted-foreground">best</span>
          </span>
          <span className="ml-auto text-muted-foreground">
            {stats.completionRate}% consistent
          </span>
        </div>
      </div>
    </Card>
  );
}
