"use client";

import { useState } from "react";
import { Pause, Play, Square, Check, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategorySelector } from "@/components/shared/category-selector";
import { CategoryDot } from "@/components/shared/category-dot";
import { useTimerStore, elapsedMs } from "@/lib/stores/timer-store";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import { formatStopwatch } from "@/lib/utils";
import { colorSoft } from "@/lib/constants";
import { useNow } from "./use-now";

/**
 * The live timer. Renders only when a timer is active. Duration is derived from
 * timestamps on every tick so it stays accurate through pauses and refreshes.
 * Supports pause/resume, inline edit (activity, category, notes), stop+save, and
 * discard.
 */
export function ActiveTimerCard() {
  const timer = useTimerStore((s) => s.timer);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const stop = useTimerStore((s) => s.stop);
  const discard = useTimerStore((s) => s.discard);
  const patch = useTimerStore((s) => s.patch);

  const categories = useDataStore((s) => s.categories);
  const addSession = useDataStore((s) => s.addSession);
  const getCategory = useDataStore((s) => s.getCategory);

  const running = timer?.status === "running";
  const now = useNow(running);
  const [editing, setEditing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!timer) return null;

  const category = getCategory(timer.categoryId);
  const elapsed = elapsedMs(timer, now);

  async function handleStop() {
    const result = await stop();
    if (!result) return;
    // Ignore sub-5-second taps so a misfire doesn't litter the timeline.
    if (result.durationMs < 5000) {
      toast({
        title: "Session discarded",
        description: "Too short to save (under 5 seconds).",
      });
      return;
    }
    await addSession({
      activityName: result.timer.activityName,
      categoryId: result.timer.categoryId,
      startTime: result.startTime,
      endTime: result.endTime,
      durationMs: result.durationMs,
      notes: result.timer.notes,
      tags: result.timer.tags,
      source: "timer",
    });
    toast({
      title: "Session saved",
      description: `${result.timer.activityName} · ${formatStopwatch(result.durationMs)}`,
      variant: "success",
    });
  }

  return (
    <Card
      className="relative overflow-hidden border-primary/30"
      style={{
        background: category
          ? `linear-gradient(180deg, ${colorSoft(category.color)}, transparent)`
          : undefined,
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <Badge variant={running ? "accent" : "warning"}>
            <span
              className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                running ? "animate-pulse bg-primary" : "bg-warning"
              }`}
            />
            {running ? "Recording" : "Paused"}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing((v) => !v)}
            aria-label="Edit session"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        {!editing ? (
          <div className="mt-3">
            <p className="text-lg font-medium leading-tight">{timer.activityName}</p>
            {category && (
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CategoryDot color={category.color} />
                {category.name}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="timer-activity">Activity</Label>
              <Input
                id="timer-activity"
                value={timer.activityName}
                onChange={(e) => patch({ activityName: e.target.value })}
                placeholder="What are you working on?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timer-category">Category</Label>
              <CategorySelector
                id="timer-category"
                categories={categories}
                value={timer.categoryId}
                onChange={(categoryId) => patch({ categoryId })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timer-notes">Notes</Label>
              <Textarea
                id="timer-notes"
                value={timer.notes ?? ""}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Optional notes…"
                rows={2}
              />
            </div>
          </div>
        )}

        <motion.div
          key={running ? "run" : "pause"}
          className="mt-5 text-center"
        >
          <span className="tabular block text-6xl font-bold tracking-tight sm:text-7xl">
            {formatStopwatch(elapsed)}
          </span>
        </motion.div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDiscard(true)}
            aria-label="Discard session"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          {running ? (
            <Button
              variant="secondary"
              size="xl"
              onClick={() => void pause()}
              className="min-w-[7rem]"
            >
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          ) : (
            <Button
              size="xl"
              onClick={() => void resume()}
              className="min-w-[7rem]"
            >
              <Play className="h-5 w-5" />
              Resume
            </Button>
          )}

          <Button
            variant="success"
            size="xl"
            onClick={() => void handleStop()}
            className="min-w-[7rem]"
          >
            <Square className="h-4 w-4 fill-current" />
            Finish
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard this session?"
        description="The time tracked so far won't be saved. This can't be undone."
        confirmLabel="Discard"
        destructive
        onConfirm={async () => {
          await discard();
          toast({ title: "Session discarded" });
        }}
      />
    </Card>
  );
}
