"use client";

import { useMemo, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { CalendarClock, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SessionCard } from "@/components/dashboard/session-card";
import { ManualEntryDialog } from "@/components/timer/manual-entry-dialog";
import { CategoryDot } from "@/components/shared/category-dot";

import { useDataStore } from "@/lib/stores/data-store";
import { toast } from "@/lib/stores/ui-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { formatDuration } from "@/lib/utils";
import { getTotalDuration as sumDurations } from "@/lib/analytics";
import type { TimeSession } from "@/lib/types";

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

export default function TimelinePage() {
  const hydrated = useHydrated();
  const sessions = useDataStore((s) => s.sessions);
  const categories = useDataStore((s) => s.categories);
  const getCategory = useDataStore((s) => s.getCategory);
  const deleteSession = useDataStore((s) => s.deleteSession);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [editSession, setEditSession] = useState<TimeSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeSession | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (categoryFilter !== "all" && s.categoryId !== categoryFilter) return false;
      if (!q) return true;
      const inName = s.activityName.toLowerCase().includes(q);
      const inNotes = s.notes?.toLowerCase().includes(q) ?? false;
      const inTags = s.tags.some((t) => t.toLowerCase().includes(q));
      return inName || inNotes || inTags;
    });
  }, [sessions, search, categoryFilter]);

  // Group filtered sessions by calendar day (already sorted newest-first).
  const groups = useMemo(() => {
    const map = new Map<string, TimeSession[]>();
    for (const s of filtered) {
      const key = format(new Date(s.startTime), "yyyy-MM-dd");
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      date: new Date(items[0].startTime),
      items,
      total: sumDurations(items),
    }));
  }, [filtered]);

  const activeFilters = search.trim() !== "" || categoryFilter !== "all";

  if (!hydrated) return <TimelineSkeleton />;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="hidden text-2xl font-bold tracking-tight lg:block">
            Timeline
          </h1>
          <p className="text-sm text-muted-foreground lg:mt-0.5">
            Your life log, one session at a time.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSession(null);
            setManualOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add session</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities, notes, tags…"
            className="pl-9"
            aria-label="Search sessions"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
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

      {/* Grouped timeline */}
      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{dayLabel(group.date)}</h2>
                <span className="tabular text-xs text-muted-foreground">
                  {formatDuration(group.total)}
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    category={getCategory(s.categoryId)}
                    onEdit={(sess) => {
                      setEditSession(sess);
                      setManualOpen(true);
                    }}
                    onDelete={(sess) => setDeleteTarget(sess)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : activeFilters ? (
        <EmptyState
          icon={Search}
          title="No matching sessions"
          description="Try a different search or clear your filters."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={CalendarClock}
          title="Your timeline is empty"
          description="Track a session or add one manually and it'll show up here, grouped by day."
          action={
            <Button
              onClick={() => {
                setEditSession(null);
                setManualOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add your first session
            </Button>
          }
        />
      )}

      <ManualEntryDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        session={editSession}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this session?"
        description="This permanently removes the tracked time. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSession(deleteTarget.id);
            toast({ title: "Session deleted" });
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full rounded-xl" />
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
