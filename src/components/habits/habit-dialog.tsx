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
import { ColorPicker } from "@/components/settings/color-picker";
import { useHabitsStore } from "@/lib/stores/habits-store";
import { toast } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import {
  HABIT_ICON_NAMES,
  DEFAULT_HABIT_ICON,
  habitIcon,
} from "./habit-icons";
import { colorHex } from "@/lib/constants";
import type { Habit } from "@/lib/types";

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
}

/** Create or edit a habit: name, description, icon, color, daily target. */
export function HabitDialog({ open, onOpenChange, habit }: HabitDialogProps) {
  const addHabit = useHabitsStore((s) => s.addHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const isEdit = Boolean(habit);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(DEFAULT_HABIT_ICON);
  const [color, setColor] = useState("green");
  const [target, setTarget] = useState("1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setIcon(habit.icon);
      setColor(habit.color);
      setTarget(String(habit.targetPerDay));
    } else {
      setName("");
      setDescription("");
      setIcon(DEFAULT_HABIT_ICON);
      setColor("green");
      setTarget("1");
    }
    setError(null);
  }, [open, habit]);

  async function handleSave() {
    if (!name.trim()) return setError("Give your habit a name.");
    const targetNum = Math.max(1, Math.floor(Number(target) || 1));

    if (isEdit && habit) {
      await updateHabit(habit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        targetPerDay: targetNum,
      });
      toast({ title: "Habit updated", variant: "success" });
    } else {
      await addHabit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        targetPerDay: targetNum,
      });
      toast({ title: "Habit created", variant: "success" });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>
            Track something you want to do consistently. Tap days to fill your grid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: colorHex(color) }}
            >
              {(() => {
                const Icon = habitIcon(icon);
                return <Icon className="h-5 w-5" />;
              })()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{name || "New habit"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {description || "Build a streak, one day at a time."}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Walk around the block"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-desc">Description</Label>
            <Textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — a short reminder of why"
              rows={1}
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {HABIT_ICON_NAMES.map((nm) => {
                const Icon = habitIcon(nm);
                const active = nm === icon;
                return (
                  <button
                    key={nm}
                    type="button"
                    onClick={() => setIcon(nm)}
                    aria-label={nm}
                    aria-pressed={active}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                      active
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                    style={active ? { backgroundColor: colorHex(color) } : undefined}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-target">Completions per day</Label>
            <Input
              id="habit-target"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              How many times counts as a full day. Most habits use 1.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()}>
            {!isEdit && <Plus className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Create habit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
