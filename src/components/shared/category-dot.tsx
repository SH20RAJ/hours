"use client";

import { cn } from "@/lib/utils";
import { colorHex } from "@/lib/constants";

/** A small filled dot in the category's color. Used in lists, chips, legends. */
export function CategoryDot({
  color,
  className,
  size = 10,
}: {
  color: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{ width: size, height: size, backgroundColor: colorHex(color) }}
      aria-hidden
    />
  );
}
