"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Database,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/shared/category-dot";
import { SettingsSection, SettingRow } from "@/components/settings/settings-section";
import { CategoryDialog } from "@/components/settings/category-dialog";
import { DeleteCategoryDialog } from "@/components/settings/delete-category-dialog";
import { ExportImportPanel } from "@/components/settings/export-import-panel";
import { IdentityMixEditor } from "@/components/settings/identity-mix-editor";
import { SyncSettingsCard } from "@/components/settings/sync-settings-card";

import { useDataStore } from "@/lib/stores/data-store";
import { useUiStore, toast } from "@/lib/stores/ui-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import type { Category, ThemePreference } from "@/lib/types";

export default function SettingsPage() {
  const hydrated = useHydrated();
  const categories = useDataStore((s) => s.categories);
  const settings = useDataStore((s) => s.settings);
  const sessions = useDataStore((s) => s.sessions);
  const updateSettings = useDataStore((s) => s.updateSettings);
  const loadDemoData = useDataStore((s) => s.loadDemoData);
  const clearAll = useDataStore((s) => s.clearAll);
  const setTheme = useUiStore((s) => s.setTheme);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  if (!hydrated) return <SettingsSkeleton />;

  function changeTheme(theme: ThemePreference) {
    setTheme(theme);
    void updateSettings({ theme });
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="hidden text-2xl font-bold tracking-tight lg:block">Settings</h1>
        <p className="text-sm text-muted-foreground lg:mt-0.5">
          Make Hours fit the way you work.
        </p>
      </header>

      {/* Cloud sync */}
      <SettingsSection
        title="Cloud sync"
        description="Back up your data and sync it across devices. Optional — Hours works fully offline."
      >
        <SyncSettingsCard />
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection title="Preferences">
        <div className="divide-y divide-border">
          <SettingRow label="Theme" description="Choose your appearance">
            <div className="flex gap-1 rounded-xl bg-secondary/70 p-1">
              {(
                [
                  { value: "light", icon: Sun },
                  { value: "dark", icon: Moon },
                  { value: "system", icon: Monitor },
                ] as const
              ).map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => changeTheme(value)}
                  aria-label={`${value} theme`}
                  aria-pressed={settings.theme === value}
                  className={`flex h-8 w-9 items-center justify-center rounded-lg transition-colors ${
                    settings.theme === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow
            label="Daily target"
            description="Hours you aim to track each day"
            htmlFor="daily-target"
          >
            <div className="relative w-28">
              <Input
                id="daily-target"
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={settings.dailyTargetHours}
                onChange={(e) =>
                  void updateSettings({
                    dailyTargetHours: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="pr-8 text-right"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                h
              </span>
            </div>
          </SettingRow>

          <SettingRow label="Week starts on" description="Used across weekly stats">
            <Select
              value={String(settings.weekStartsOn)}
              onValueChange={(v) =>
                void updateSettings({ weekStartsOn: Number(v) as 0 | 1 })
              }
            >
              <SelectTrigger className="w-36" aria-label="Week starts on">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="0">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </SettingsSection>

      {/* Categories */}
      <SettingsSection
        title="Categories"
        description="Map activities to an identity and tone."
      >
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <CategoryDot color={c.color} size={14} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-tight">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.identity}</p>
              </div>
              <Badge
                variant={
                  c.tone === "positive"
                    ? "positive"
                    : c.tone === "negative"
                      ? "negative"
                      : "default"
                }
              >
                {c.tone}
              </Badge>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditCategory(c);
                    setCatDialogOpen(true);
                  }}
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteCategory(c)}
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => {
            setEditCategory(null);
            setCatDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </SettingsSection>

      {/* Future-self mix */}
      <SettingsSection
        title="Future-self mix"
        description="Your target identity distribution. Alignment is measured against this."
      >
        <IdentityMixEditor />
      </SettingsSection>

      {/* Data */}
      <SettingsSection title="Data" description="Your data lives only on this device.">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Backup</p>
            <ExportImportPanel />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium">Demo data</p>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setConfirmDemo(true)}
            >
              <Sparkles className="h-4 w-4" />
              Load 14 days of demo data
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Adds realistic sessions so you can explore the dashboards. Your
              existing data is kept.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection
        title="Danger zone"
        description="Irreversible actions. Export a backup first."
        className="border-destructive/30"
      >
        <div className="flex items-start gap-3 rounded-xl bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium">Clear all data</p>
            <p className="text-sm text-muted-foreground">
              Permanently deletes every session, goal, and custom category. Default
              categories are restored.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setConfirmClear(true)}>
            <Database className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </SettingsSection>

      {/* Dialogs */}
      <CategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        category={editCategory}
      />
      <DeleteCategoryDialog
        open={Boolean(deleteCategory)}
        onOpenChange={(o) => !o && setDeleteCategory(null)}
        category={deleteCategory}
      />
      <ConfirmDialog
        open={confirmDemo}
        onOpenChange={setConfirmDemo}
        title="Load demo data?"
        description="This adds about 14 days of sample sessions alongside your current data."
        confirmLabel="Load demo data"
        onConfirm={async () => {
          await loadDemoData();
          toast({ title: "Demo data loaded", variant: "success" });
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear all data?"
        description={`This permanently deletes ${sessions.length} session${sessions.length === 1 ? "" : "s"} and all goals. This can't be undone.`}
        confirmLabel="Yes, clear everything"
        destructive
        onConfirm={async () => {
          await clearAll();
          toast({ title: "All data cleared" });
        }}
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  );
}
