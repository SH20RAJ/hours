import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import type { Insight } from "@/lib/types";

const config = {
  positive: {
    icon: TrendingUp,
    wrap: "border-success/30 bg-success/5",
    chip: "bg-success/15 text-success",
  },
  warning: {
    icon: AlertTriangle,
    wrap: "border-warning/30 bg-warning/5",
    chip: "bg-warning/15 text-warning",
  },
  neutral: {
    icon: Sparkles,
    wrap: "border-border bg-card",
    chip: "bg-accent text-accent-foreground",
  },
} as const;

/** A single motivating insight. Tone drives the icon and accent color. */
export function InsightCard({ insight }: { insight: Insight }) {
  const c = config[insight.tone];
  const Icon = c.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border p-4", c.wrap)}>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          c.chip,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-medium leading-tight">{insight.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
      </div>
    </div>
  );
}
