"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorHex, colorSoft, QUICK_ACTIONS } from "@/lib/constants";
import { useDataStore } from "@/lib/stores/data-store";

interface QuickStartGridProps {
  /** Called with a category id (and optional activity label) to start quickly. */
  onQuickStart: (categoryId: string, activity?: string) => void;
}

/**
 * One-tap start buttons. Surfaces the user's recent categories first, then fills
 * with the default quick actions — so the most likely choice is always a thumb
 * away. Starting a session here takes a single tap.
 */
export function QuickStartGrid({ onQuickStart }: QuickStartGridProps) {
  const categories = useDataStore((s) => s.categories);
  const sessions = useDataStore((s) => s.sessions);

  // Rank categories by recent usage (last 20 sessions), newest first.
  const recentOrder = new Map<string, number>();
  for (const s of sessions.slice(0, 20)) {
    if (!recentOrder.has(s.categoryId)) {
      recentOrder.set(s.categoryId, recentOrder.size);
    }
  }

  const byName = new Map(categories.map((c) => [c.name, c]));
  // Seed from quick-action presets, mapped to real categories where they exist.
  const seeded = QUICK_ACTIONS.map((q) => byName.get(q.categoryName)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  // Merge: recent categories first, then seeded presets, dedup by id.
  const recentCats = [...recentOrder.keys()]
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const ordered: typeof categories = [];
  const seen = new Set<string>();
  for (const c of [...recentCats, ...seeded, ...categories]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      ordered.push(c);
    }
    if (ordered.length >= 6) break;
  }

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {ordered.map((c) => (
        <button
          key={c.id}
          onClick={() => onQuickStart(c.id, c.name)}
          className={cn(
            "group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border p-3 text-center transition-all",
            "hover:border-transparent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          style={{ backgroundColor: colorSoft(c.color) }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: colorHex(c.color) }}
          >
            <Plus className="h-5 w-5" />
          </span>
          <span className="line-clamp-1 text-xs font-medium">{c.name}</span>
        </button>
      ))}
    </div>
  );
}
