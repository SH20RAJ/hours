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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelector } from "@/components/shared/category-selector";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import type { Goal, GoalPeriod, GoalType } from "@/lib/types";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

const TYPE_OPTIONS: { value: GoalType; label: string; hint: string }[] = [
  { value: "category_hours", label: "Category hours", hint: "Spend N hours on a category" },
  { value: "total_hours", label: "Total hours", hint: "Track N hours overall" },
  { value: "negative_limit", label: "Time limit", hint: "Keep a category under N hours" },
  { value: "identity_percentage", label: "Identity target", hint: "Reach N% of an identity" },
];

const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface FormState {
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: string;
  categoryId: string;
  identity: string;
}

/** Create or edit a goal. The visible fields adapt to the chosen goal type. */
export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const categories = useDataStore((s) => s.categories);
  const addGoal = useDataStore((s) => s.addGoal);
  const updateGoal = useDataStore((s) => s.updateGoal);

  const identities = [...new Set(categories.map((c) => c.identity))];
  const isEdit = Boolean(goal);

  const [form, setForm] = useState<FormState>({
    title: "",
    type: "category_hours",
    period: "weekly",
    targetValue: "",
    categoryId: "",
    identity: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setForm({
        title: goal.title,
        type: goal.type,
        period: goal.period,
        targetValue: String(goal.targetValue),
        categoryId: goal.categoryId ?? "",
        identity: goal.identity ?? "",
      });
    } else {
      setForm({
        title: "",
        type: "category_hours",
        period: "weekly",
        targetValue: "",
        categoryId: categories[0]?.id ?? "",
        identity: identities[0] ?? "",
      });
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const needsCategory = form.type === "category_hours" || form.type === "negative_limit";
  const needsIdentity = form.type === "identity_percentage";
  const unit = needsIdentity ? "%" : "hours";

  async function handleSave() {
    const target = Number(form.targetValue);
    if (!form.title.trim()) return setError("Give your goal a title.");
    if (!Number.isFinite(target) || target <= 0) {
      return setError("Enter a target greater than zero.");
    }
    if (needsCategory && !form.categoryId) return setError("Pick a category.");
    if (needsIdentity && !form.identity) return setError("Pick an identity.");

    const payload = {
      title: form.title.trim(),
      type: form.type,
      period: form.period,
      targetValue: target,
      categoryId: needsCategory ? form.categoryId : undefined,
      identity: needsIdentity ? form.identity : undefined,
      isActive: true,
    };

    if (isEdit && goal) {
      await updateGoal(goal.id, payload);
      toast({ title: "Goal updated", variant: "success" });
    } else {
      await addGoal(payload);
      toast({ title: "Goal created", variant: "success" });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>
            Set a target and Hours will track your progress automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Code 20 hours this week"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as GoalType)}>
                <SelectTrigger aria-label="Goal type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select
                value={form.period}
                onValueChange={(v) => set("period", v as GoalPeriod)}
              >
                <SelectTrigger aria-label="Goal period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsCategory && (
            <div className="space-y-1.5">
              <Label>Category</Label>
              <CategorySelector
                categories={categories}
                value={form.categoryId}
                onChange={(id) => set("categoryId", id)}
              />
            </div>
          )}

          {needsIdentity && (
            <div className="space-y-1.5">
              <Label>Identity</Label>
              <Select value={form.identity} onValueChange={(v) => set("identity", v)}>
                <SelectTrigger aria-label="Identity">
                  <SelectValue placeholder="Choose an identity" />
                </SelectTrigger>
                <SelectContent>
                  {identities.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Target ({unit})</Label>
            <Input
              id="goal-target"
              type="number"
              inputMode="decimal"
              min={0}
              step={needsIdentity ? 1 : 0.5}
              value={form.targetValue}
              onChange={(e) => set("targetValue", e.target.value)}
              placeholder={needsIdentity ? "30" : "20"}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()}>
            {!isEdit && <Plus className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
