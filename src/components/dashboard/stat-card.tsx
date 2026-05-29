import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}

/** Compact metric tile used on Today and Insights. */
export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              backgroundColor: accent ? `${accent}22` : "hsl(var(--accent))",
              color: accent ?? "hsl(var(--accent-foreground))",
            }}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </Card>
  );
}
