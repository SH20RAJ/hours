"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";

/**
 * Export the full dataset to a JSON file, or import one back. Import is
 * validated before it touches the database and replaces all existing data, so
 * we gate it behind a clear warning.
 */
export function ExportImportPanel() {
  const exportData = useDataStore((s) => s.exportData);
  const importData = useDataStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    try {
      const payload = await exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `hours-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported", variant: "success" });
    } catch {
      toast({ title: "Export failed", variant: "error" });
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;

    if (
      !window.confirm(
        "Importing will replace all current data with the contents of this file. Continue?",
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const text = await file.text();
      await importData(text);
      toast({ title: "Data imported", variant: "success" });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <Button variant="secondary" onClick={() => void handleExport()} className="flex-1">
        <Download className="h-4 w-4" />
        Export JSON
      </Button>
      <Button
        variant="secondary"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="flex-1"
      >
        <Upload className="h-4 w-4" />
        {busy ? "Importing…" : "Import JSON"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
