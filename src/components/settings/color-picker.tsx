"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, COLOR_KEYS } from "@/lib/constants";

/** Swatch grid for picking a category color. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_KEYS.map((key) => {
        const c = CATEGORY_COLORS[key];
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={c.label}
            aria-pressed={active}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform",
              active ? "ring-2 ring-foreground scale-110" : "hover:scale-105",
            )}
            style={{ backgroundColor: c.hex }}
          >
            {active && <Check className="h-4 w-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
