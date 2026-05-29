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
import { ColorPicker } from "./color-picker";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import type { Category, Tone } from "@/lib/types";

const TONE_OPTIONS: { value: Tone; label: string; hint: string }[] = [
  { value: "positive", label: "Positive", hint: "Builds you up" },
  { value: "neutral", label: "Neutral", hint: "Rest & maintenance" },
  { value: "negative", label: "Negative", hint: "Time leak" },
];

/** Create or edit a category: name, identity label, color, and tone. */
export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}) {
  const addCategory = useDataStore((s) => s.addCategory);
  const updateCategory = useDataStore((s) => s.updateCategory);
  const isEdit = Boolean(category);

  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [color, setColor] = useState("blue");
  const [tone, setTone] = useState<Tone>("positive");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (category) {
      setName(category.name);
      setIdentity(category.identity);
      setColor(category.color);
      setTone(category.tone);
    } else {
      setName("");
      setIdentity("");
      setColor("blue");
      setTone("positive");
    }
    setError(null);
  }, [open, category]);

  async function handleSave() {
    if (!name.trim()) return setError("Give this category a name.");
    if (!identity.trim()) return setError("Add an identity label (e.g. Developer).");

    if (isEdit && category) {
      await updateCategory(category.id, {
        name: name.trim(),
        identity: identity.trim(),
        color,
        tone,
      });
      toast({ title: "Category updated", variant: "success" });
    } else {
      await addCategory({ name: name.trim(), identity: identity.trim(), color, tone });
      toast({ title: "Category created", variant: "success" });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Categories map your activities to an identity and tone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coding"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-identity">Identity</Label>
              <Input
                id="cat-identity"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="e.g. Developer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger aria-label="Tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label} — {o.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()}>
            {!isEdit && <Plus className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
