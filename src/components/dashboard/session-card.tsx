"use client";

import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { colorSoft } from "@/lib/constants";
import { CategoryDot } from "@/components/shared/category-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category, TimeSession } from "@/lib/types";

interface SessionCardProps {
  session: TimeSession;
  category?: Category;
  onEdit?: (session: TimeSession) => void;
  onDelete?: (session: TimeSession) => void;
  /** Compact mode hides notes/tags for dense lists. */
  compact?: boolean;
}

/** A single tracked session row with time range, duration, and quick actions. */
export function SessionCard({
  session,
  category,
  onEdit,
  onDelete,
  compact,
}: SessionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);

  return (
    <div
      className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-border/80"
      style={{
        background: category
          ? `linear-gradient(90deg, ${colorSoft(category.color)} 0%, transparent 40%)`
          : undefined,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {category && <CategoryDot color={category.color} />}
          <p className="truncate font-medium leading-tight">
            {session.activityName}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{category?.name ?? "Uncategorized"}</span>
          <span aria-hidden>·</span>
          <span className="tabular">
            {format(start, "h:mm a")} – {format(end, "h:mm a")}
          </span>
          {session.source === "manual" && (
            <Badge variant="outline" className="px-1.5 py-0 text-[0.6rem]">
              manual
            </Badge>
          )}
        </div>

        {!compact && (session.notes || session.tags.length > 0) && (
          <div className="mt-2 space-y-1.5">
            {session.notes && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{session.notes}</span>
              </p>
            )}
            {session.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {session.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] text-secondary-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="tabular text-sm font-semibold">
          {formatDuration(session.durationMs)}
        </span>
        {(onEdit || onDelete) && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Session actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div
                  className={cn(
                    "absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-2xl",
                    "animate-scale-in origin-top-right",
                  )}
                >
                  {onEdit && (
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-accent"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(session);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(session);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
