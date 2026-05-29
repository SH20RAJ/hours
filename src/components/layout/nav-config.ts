import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarClock,
  BarChart3,
  Target,
  Fingerprint,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/identity", label: "Identity", icon: Fingerprint },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Items shown in the mobile bottom bar (Settings lives in the header on mobile). */
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (i) => i.href !== "/settings",
);
