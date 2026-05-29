"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatDuration } from "@/lib/utils";
import type { CategoryBreakdownItem } from "@/lib/types";
import { colorHex } from "@/lib/constants";

/**
 * Donut of time by category. Center shows the total. Designed to resize fluidly
 * inside its card on any screen. Renders nothing meaningful for empty data — the
 * caller should guard with an EmptyState first.
 */
export function CategoryBreakdownChart({
  data,
  total,
}: {
  data: CategoryBreakdownItem[];
  total: string;
}) {
  const chartData = data.map((d) => ({
    name: d.category.name,
    value: d.durationMs,
    color: colorHex(d.category.color),
    pct: d.percentage,
  }));

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof chartData)[number];
              return (
                <div className="rounded-xl border border-border bg-popover px-3 py-2 text-sm shadow-xl">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground">
                    {formatDuration(p.value)} · {Math.round(p.pct)}%
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-bold">{total}</span>
        <span className="text-xs text-muted-foreground">total</span>
      </div>
    </div>
  );
}
