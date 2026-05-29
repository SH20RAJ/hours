"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/shared/category-dot";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import type { Category } from "@/lib/types";

/**
 * Safe category deletion. If sessions reference the category, we require the
 * user to either reassign them to another category or confirm deleting those
 * sessions too — never silently orphaning data.
 */
export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}) {
  const categories = useDataStore((s) => s.categories);
  const deleteCategory = useDataStore((s) => s.deleteCategory);
  const sessionsUsingCategory = useDataStore((s) => s.sessionsUsingCategory);

  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");
  const [pending, setPending] = useState(false);

  const others = categories.filter((c) => c.id !== category?.id);

  useEffect(() => {
    if (!open || !category) return;
    setUsageCount(null);
    setReassignTo(others[0]?.id ?? "");
    void sessionsUsingCategory(category.id).then(setUsageCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  async function handleDelete() {
    if (!category) return;
    setPending(true);
    try {
      // Reassign when sessions exist and a target is chosen; otherwise plain delete.
      const shouldReassign = (usageCount ?? 0) > 0 && reassignTo;
      await deleteCategory(category.id, shouldReassign ? reassignTo : undefined);
      toast({
        title: "Category deleted",
        description: shouldReassign ? "Sessions were reassigned." : undefined,
      });
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  const hasSessions = (usageCount ?? 0) > 0;
  const canDelete = others.length > 0 || !hasSessions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{category?.name}”?</DialogTitle>
          <DialogDescription>
            {usageCount === null
              ? "Checking how this category is used…"
              : hasSessions
                ? `${usageCount} session${usageCount === 1 ? "" : "s"} use this category. Pick where to move them.`
                : "This category has no sessions and can be safely removed."}
          </DialogDescription>
        </DialogHeader>

        {hasSessions && others.length > 0 && (
          <div className="space-y-1.5">
            <Label>Reassign sessions to</Label>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger aria-label="Reassign to category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {others.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <CategoryDot color={c.color} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasSessions && others.length === 0 && (
          <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
            This is your only category. Create another one first so its sessions
            have somewhere to go.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={pending || usageCount === null || !canDelete}
          >
            {pending ? "Deleting…" : "Delete category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
