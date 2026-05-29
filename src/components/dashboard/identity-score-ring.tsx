"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IdentityScoreRingProps {
  /** 0-100 alignment score. */
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

/**
 * Circular progress ring for the Future-Self Alignment score. Color shifts from
 * warm (low alignment) to green (high) so the state reads at a glance. Respects
 * reduced motion via Framer's global setting.
 */
export function IdentityScoreRing({
  score,
  size = 168,
  strokeWidth = 14,
  label,
  sublabel,
  className,
}: IdentityScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 75
      ? "hsl(var(--success))"
      : clamped >= 50
        ? "hsl(var(--primary))"
        : clamped >= 25
          ? "hsl(var(--warning))"
          : "hsl(var(--destructive))";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-4xl font-bold tracking-tight">
          {Math.round(clamped)}
        </span>
        {label && (
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        )}
        {sublabel && (
          <span className="mt-0.5 max-w-[7rem] text-[0.65rem] leading-tight text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
