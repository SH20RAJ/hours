"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  /** Optional explicit bar color (e.g. a category hex). Defaults to primary. */
  color?: string;
  /** Track height. */
  size?: "sm" | "default" | "lg";
  indeterminate?: boolean;
}

const sizeClass: Record<NonNullable<ProgressProps["size"]>, string> = {
  sm: "h-1.5",
  default: "h-2.5",
  lg: "h-3.5",
};

/**
 * Lightweight progress bar. We use a plain div rather than Radix here because
 * we frequently render dozens (category lists) and want per-bar colors.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, color, size = "default", indeterminate, ...props }, ref) => {
    const pct = clamp(value, 0, 100);
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClass[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            !color && "bg-primary",
          )}
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
