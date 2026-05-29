"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { DailyTrendPoint } from "@/lib/types";

/**
 * Bar chart of hours per day. Highlights the most productive day with the
 * primary color; other bars use a muted tone so the peak reads instantly.
 */
export function WeeklyHoursChart({ data }: { data: DailyTrendPoint[] }) {
  const maxHours = Math.max(...data.map((d) => d.hours), 0);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `${v}h`}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--secondary) / 0.5)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const hours = payload[0].value as number;
              return (
                <div className="rounded-xl border border-border bg-popover px-3 py-2 text-sm shadow-xl">
                  <p className="font-medium">{label}</p>
                  <p className="text-muted-foreground">{hours.toFixed(1)}h tracked</p>
                </div>
              );
            }}
          />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((d) => (
              <Cell
                key={d.date}
                fill={
                  d.hours === maxHours && maxHours > 0
                    ? "hsl(var(--primary))"
                    : "hsl(var(--secondary))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
