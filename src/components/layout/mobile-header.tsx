"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Settings, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui-store";
import { useDataStore } from "@/lib/stores/data-store";
import { NAV_ITEMS } from "./nav-config";
import { AuthMenu } from "@/components/auth/auth-menu";

/**
 * Compact sticky header for mobile only. Shows the current section title, the
 * brand on the home screen, and quick access to theme + settings. Desktop uses
 * the sidebar instead, so this is hidden at lg.
 */
export function MobileHeader() {
  const pathname = usePathname();
  const resolvedTheme = useUiStore((s) => s.resolvedTheme);
  const updateSettings = useDataStore((s) => s.updateSettings);

  const current = NAV_ITEMS.find((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
  );
  const title = current?.href === "/" ? "Hours" : current?.label ?? "Hours";

  function toggleTheme() {
    void updateSettings({ theme: resolvedTheme === "dark" ? "light" : "dark" });
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-border safe-top lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {current?.href === "/" ? (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">Hours</span>
            </>
          ) : (
            <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon-sm" asChild aria-label="Settings">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <AuthMenu variant="compact" />
        </div>
      </div>
    </header>
  );
}
