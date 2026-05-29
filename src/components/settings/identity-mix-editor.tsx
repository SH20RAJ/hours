"use client";

import { useEffect, useState } from "react";
import { Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import type { DesiredIdentity } from "@/lib/types";

/**
 * Editor for the user's desired identity mix — the target distribution the
 * Future-Self Alignment score compares against. Shows the live total so the
 * user can balance toward 100%, though the score normalizes regardless.
 */
export function IdentityMixEditor() {
  const settings = useDataStore((s) => s.settings);
  const categories = useDataStore((s) => s.categories);
  const updateSettings = useDataStore((s) => s.updateSettings);

  const [rows, setRows] = useState<DesiredIdentity[]>(settings.desiredIdentities);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRows(settings.desiredIdentities);
    setDirty(false);
  }, [settings.desiredIdentities]);

  const knownIdentities = [...new Set(categories.map((c) => c.identity))];
  const total = rows.reduce((sum, r) => sum + (Number(r.targetPercentage) || 0), 0);

  function update(index: number, patch: Partial<DesiredIdentity>) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  function addRow() {
    const unused = knownIdentities.find((id) => !rows.some((r) => r.identity === id));
    setRows((rs) => [...rs, { identity: unused ?? "", targetPercentage: 10 }]);
    setDirty(true);
  }

  function removeRow(index: number) {
    setRows((rs) => rs.filter((_, i) => i !== index));
    setDirty(true);
  }

  async function save() {
    const cleaned = rows
      .map((r) => ({
        identity: r.identity.trim(),
        targetPercentage: Math.max(0, Number(r.targetPercentage) || 0),
      }))
      .filter((r) => r.identity);
    await updateSettings({ desiredIdentities: cleaned });
    toast({ title: "Future-self mix saved", variant: "success" });
    setDirty(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              list="identity-options"
              value={row.identity}
              onChange={(e) => update(i, { identity: e.target.value })}
              placeholder="Identity"
              className="flex-1"
              aria-label={`Identity ${i + 1}`}
            />
            <div className="relative w-24">
              <Input
                type="number"
                min={0}
                max={100}
                value={row.targetPercentage}
                onChange={(e) =>
                  update(i, { targetPercentage: Number(e.target.value) })
                }
                className="pr-7 text-right"
                aria-label={`${row.identity || "Identity"} target percentage`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRow(i)}
              aria-label="Remove identity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <datalist id="identity-options">
          {knownIdentities.map((id) => (
            <option key={id} value={id} />
          ))}
        </datalist>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4" />
          Add identity
        </Button>
        <span
          className={cn(
            "text-sm font-medium",
            total === 100 ? "text-success" : "text-muted-foreground",
          )}
        >
          Total: {total}%
        </span>
      </div>

      {dirty && (
        <Button onClick={() => void save()} className="w-full">
          <Save className="h-4 w-4" />
          Save mix
        </Button>
      )}
    </div>
  );
}
