"use client";

import { useEffect, useMemo, useRef } from "react";
import { format, parseISO, getDay } from "date-fns";
import type { HabitDay } from "@/lib/types";
import { colorHex } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ContributionGraphProps {
  days: HabitDay[];
  color: string;
  /** 0 = Sunday, 1 = Monday — controls which weekday sits on the top row. */
  weekStartsOn?: 0 | 1;
  /** Optional click handler (e.g. toggle that day). */
  onDayClick?: (date: string) => void;
  className?: string;
}

/** Per-level opacity applied to the habit color. Level 0 falls back to a track. */
const LEVEL_OPACITY = [0, 0.28, 0.5, 0.74, 1] as const;

/**
 * GitHub-style contribution grid: 7 rows (weekdays) × N week-columns. Days flow
 * top-to-bottom within a column, columns left-to-right oldest→newest. Leading
 * blanks pad the first partial week so weekdays line up. Auto-scrolls to the
 * latest week on mount and respects the user's week-start preference.
 */
export function ContributionGraph({
  days,
  color,
  weekStartsOn = 1,
  onDayClick,
  className,
}: ContributionGraphProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hex = colorHex(color);

  const { columns, weekdayLabels } = useMemo(() => {
    // Offset of a JS weekday (0=Sun) into our grid row given the week start.
    const rowOf = (date: Date) => (getDay(date) - weekStartsOn + 7) % 7;

    const cells: (HabitDay | null)[] = [];
    if (days.length > 0) {
      const firstRow = rowOf(parseISO(days[0].date));
      for (let i = 0; i < firstRow; i++) cells.push(null); // leading pad
    }
    for (const d of days) cells.push(d);
    // Trailing pad to complete the final week column.
    while (cells.length % 7 !== 0) cells.push(null);

    const cols: (HabitDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      cols.push(cells.slice(i, i + 7));
    }

    const base = weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Only label alternating rows to reduce clutter.
    const labels = base.map((l, i) => (i % 2 === 1 ? l : ""));

    return { columns: cols, weekdayLabels: labels };
  }, [days, weekStartsOn]);

  // Scroll to the most recent week on mount / when data grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [columns.length]);

  return (
    <div className={cn("flex gap-1.5", className)}>
      {/* Weekday labels */}
      <div className="flex flex-col gap-[3px] pt-[1px] pr-0.5">
        {weekdayLabels.map((label, i) => (
          <span
            key={i}
            className="h-[12px] text-[9px] leading-[12px] text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>

      <div ref={scrollRef} className="no-scrollbar overflow-x-auto">
        <div className="flex gap-[3px]">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((day, ri) => {
                if (!day) {
                  return <div key={ri} className="h-[12px] w-[12px]" aria-hidden />;
                }
                const opacity = LEVEL_OPACITY[day.level];
                const label = `${format(parseISO(day.date), "MMM d, yyyy")}: ${
                  day.count > 0 ? `${day.count} done` : "none"
                }`;
                return (
                  <button
                    key={ri}
                    type="button"
                    title={label}
                    aria-label={label}
                    onClick={onDayClick ? () => onDayClick(day.date) : undefined}
                    disabled={!onDayClick}
                    className={cn(
                      "h-[12px] w-[12px] rounded-[3px] border border-black/5 transition-transform dark:border-white/5",
                      onDayClick && "hover:scale-125 hover:ring-1 hover:ring-ring",
                      !onDayClick && "cursor-default",
                    )}
                    style={{
                      backgroundColor:
                        day.level === 0 ? "hsl(var(--secondary))" : hex,
                      opacity: day.level === 0 ? 1 : opacity,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compact legend: "Less [][][][][] More" in the habit color. */
export function ContributionLegend({ color }: { color: string }) {
  const hex = colorHex(color);
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>Less</span>
      {LEVEL_OPACITY.map((op, i) => (
        <span
          key={i}
          className="h-[10px] w-[10px] rounded-[2px]"
          style={{
            backgroundColor: i === 0 ? "hsl(var(--secondary))" : hex,
            opacity: i === 0 ? 1 : op,
          }}
        />
      ))}
      <span>More</span>
    </div>
  );
}
