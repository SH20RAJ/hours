"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import { isoToLocalInput, localInputToIso, nowIso } from "@/lib/utils";
import type { TimeSession } from "@/lib/types";

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this session instead of creating one. */
  session?: TimeSession | null;
}

interface FormState {
  activityName: string;
  categoryId: string;
  start: string; // datetime-local
  end: string; // datetime-local
  notes: string;
  tags: string;
}

function blankForm(defaultCategoryId: string): FormState {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  return {
    activityName: "",
    categoryId: defaultCategoryId,
    start: isoToLocalInput(hourAgo.toISOString()),
    end: isoToLocalInput(now.toISOString()),
    notes: "",
    tags: "",
  };
}

/**
 * Create or edit a session manually. Validates that activity and category are
 * present and that the end time is strictly after the start. Used for logging
 * forgotten sessions and fixing existing ones.
 */
export function ManualEntryDialog({
  open,
  onOpenChange,
  session,
}: ManualEntryDialogProps) {
  const categories = useDataStore((s) => s.categories);
  const addSession = useDataStore((s) => s.addSession);
  const updateSession = useDataStore((s) => s.updateSession);

  const isEdit = Boolean(session);
  const [form, setForm] = useState<FormState>(() => blankForm(""));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Reset the form whenever the dialog opens or the target session changes.
  useEffect(() => {
    if (!open) return;
    if (session) {
      setForm({
        activityName: session.activityName,
        categoryId: session.categoryId,
        start: isoToLocalInput(session.startTime),
        end: isoToLocalInput(session.endTime),
        notes: session.notes ?? "",
        tags: session.tags.join(", "),
      });
    } else {
      setForm(blankForm(categories[0]?.id ?? ""));
    }
    setErrors({});
  }, [open, session, categories]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): { ok: boolean; startIso: string; endIso: string; durationMs: number } {
    const next: typeof errors = {};
    if (!form.activityName.trim()) next.activityName = "Give this activity a name.";
    if (!form.categoryId) next.categoryId = "Pick a category.";

    const startIso = localInputToIso(form.start);
    const endIso = localInputToIso(form.end);
    if (!startIso) next.start = "Enter a valid start time.";
    if (!endIso) next.end = "Enter a valid end time.";

    let durationMs = 0;
    if (startIso && endIso) {
      durationMs = new Date(endIso).getTime() - new Date(startIso).getTime();
      if (durationMs <= 0) next.end = "End time must be after the start time.";
    }

    setErrors(next);
    return { ok: Object.keys(next).length === 0, startIso, endIso, durationMs };
  }

  async function handleSave() {
    const { ok, startIso, endIso, durationMs } = validate();
    if (!ok) return;

    const tags = form.tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    if (isEdit && session) {
      await updateSession(session.id, {
        activityName: form.activityName.trim(),
        categoryId: form.categoryId,
        startTime: startIso,
        endTime: endIso,
        durationMs,
        notes: form.notes.trim() || undefined,
        tags,
      });
      toast({ title: "Session updated", variant: "success" });
    } else {
      await addSession({
        activityName: form.activityName.trim(),
        categoryId: form.categoryId,
        startTime: startIso,
        endTime: endIso,
        durationMs,
        notes: form.notes.trim() || undefined,
        tags,
        source: "manual",
      });
      toast({ title: "Session added", variant: "success" });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit session" : "Add session"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this tracked session."
              : "Log time you forgot to track. Enter when it happened and how long."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="manual-activity">Activity</Label>
            <Input
              id="manual-activity"
              value={form.activityName}
              onChange={(e) => set("activityName", e.target.value)}
              placeholder="e.g. Morning deep work"
              aria-invalid={Boolean(errors.activityName)}
            />
            {errors.activityName && (
              <p className="text-xs text-destructive">{errors.activityName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-category">Category</Label>
            <CategorySelector
              id="manual-category"
              categories={categories}
              value={form.categoryId}
              onChange={(id) => set("categoryId", id)}
            />
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-start">Start</Label>
              <Input
                id="manual-start"
                type="datetime-local"
                value={form.start}
                max={form.end || undefined}
                onChange={(e) => set("start", e.target.value)}
                aria-invalid={Boolean(errors.start)}
              />
              {errors.start && (
                <p className="text-xs text-destructive">{errors.start}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-end">End</Label>
              <Input
                id="manual-end"
                type="datetime-local"
                value={form.end}
                onChange={(e) => set("end", e.target.value)}
                aria-invalid={Boolean(errors.end)}
              />
              {errors.end && <p className="text-xs text-destructive">{errors.end}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-tags">Tags</Label>
              <Input
                id="manual-tags"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="study, focus"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-notes">Notes</Label>
              <Textarea
                id="manual-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
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
          <Button onClick={() => void handleSave()}>
            {!isEdit && <Plus className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Add session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
