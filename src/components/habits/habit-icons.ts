"use client";

import {
  Activity,
  Dumbbell,
  BookOpen,
  Code,
  Brain,
  Heart,
  Moon,
  Coffee,
  Droplet,
  Footprints,
  Music,
  PenLine,
  Languages,
  Apple,
  Bike,
  Leaf,
  Sun,
  Target,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon set for habits. Stored as a string name on the habit so it
 * survives export/import without bundling a component. `habitIcon()` resolves
 * the name back to a component, falling back to a sensible default.
 */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  Activity,
  Dumbbell,
  BookOpen,
  Code,
  Brain,
  Heart,
  Moon,
  Coffee,
  Droplet,
  Footprints,
  Music,
  PenLine,
  Languages,
  Apple,
  Bike,
  Leaf,
  Sun,
  Target,
  Sparkles,
};

export const HABIT_ICON_NAMES = Object.keys(HABIT_ICONS);

export const DEFAULT_HABIT_ICON = "Target";

export function habitIcon(name: string): LucideIcon {
  return HABIT_ICONS[name] ?? CheckCircle2;
}
