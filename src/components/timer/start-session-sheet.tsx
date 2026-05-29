"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CategorySelector } from "@/components/shared/category-selector";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";

interface StartSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected category (e.g. from a quick-start tap). */
  defaultCategoryId?: string;
  defaultActivity?: string;
}

/**
 * Sheet for starting a focus session with an activity name and category. The
 * last-used category is suggested by the Today page so this opens pre-filled.
 */
export function StartSessionSheet({
  open,
  onOpenChange,
  defaultCategoryId,
  defaultActivity,
}: StartSessionSheetProps) {
  const categories = useDataStore((s) => s.categories);
  const start = useTimerStore((s) => s.start);

  const [activity, setActivity] = useState(defaultActivity ?? "");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Sync defaults whenever the sheet reopens with new presets.
  const [lastKey, setLastKey] = useState("");
  const key = `${open}-${defaultCategoryId}-${defaultActivity}`;
  if (open && key !== lastKey) {
    setLastKey(key);
    setActivity(defaultActivity ?? "");
    setCategoryId(defaultCategoryId ?? categories[0]?.id ?? "");
    setNotes("");
    setTagsInput("");
  }

  async function handleStart() {
    const chosen = categoryId || categories[0]?.id;
    if (!chosen) {
      toast({ title: "Add a category first", variant: "error" });
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const ok = await start({
      activityName: activity.trim() || "Focus session",
      categoryId: chosen,
      notes: notes.trim() || undefined,
      tags,
    });
    if (!ok) {
      toast({
        title: "A timer is already running",
        description: "Finish or discard it before starting another.",
        variant: "error",
      });
      return;
    }
    onOpenChange(false);
    toast({ title: "Timer started", variant: "success" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a focus session</DialogTitle>
          <DialogDescription>
            Name what you&apos;re doing and pick a category. You can edit it while
            it runs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="start-activity">Activity</Label>
            <Input
              id="start-activity"
              autoFocus
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. Building the timer module"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleStart();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start-category">Category</Label>
            <CategorySelector
              id="start-category"
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start-tags">Tags</Label>
              <Input
                id="start-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="focus, work"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start-notes">Notes</Label>
              <Textarea
                id="start-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                rows={1}
                className="min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleStart()}>
            <Play className="h-4 w-4" />
            Start timer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
