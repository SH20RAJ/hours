"use client";

import { CheckCircle2, AlertTriangle, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/shared/category-dot";
import type { GoalProgress, Category } from "@/lib/types";

const PERIOD_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const TYPE_LABEL: Record<string, string> = {
  category_hours: "Category hours",
  identity_percentage: "Identity target",
  negative_limit: "Time limit",
  total_hours: "Total hours",
};

/** A goal with its live progress, status badge, and edit/delete menu. */
export function GoalCard({
  progress,
  category,
  onEdit,
  onDelete,
}: {
  progress: GoalProgress;
  category?: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { goal, percentage, isComplete, atRisk, label } = progress;
  const [menuOpen, setMenuOpen] = useState(false);

  const barColor = isComplete
    ? "hsl(var(--success))"
    : atRisk
      ? "hsl(var(--warning))"
      : category
        ? undefined
        : "hsl(var(--primary))";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {category && <CategoryDot color={category.color} />}
            <p className="truncate font-medium leading-tight">{goal.title}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[0.65rem]">
              {PERIOD_LABEL[goal.period]}
            </Badge>
            <Badge variant="default" className="text-[0.65rem]">
              {TYPE_LABEL[goal.type]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isComplete && (
            <Badge variant="positive">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </Badge>
          )}
          {atRisk && !isComplete && (
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3" />
              At risk
            </Badge>
          )}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Goal actions"
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
                      onEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
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
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="tabular font-semibold">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} color={barColor} size="lg" />
      </div>
    </Card>
  );
}
