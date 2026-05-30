"use client";

import { useEffect } from "react";
import { useDataStore } from "@/lib/stores/data-store";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { useHabitsStore } from "@/lib/stores/habits-store";
import { AuthProvider } from "@/components/auth/auth-provider";

/**
 * Boots the local-first data layer: hydrates Dexie-backed stores, restores any
 * running timer, and syncs the theme. Renders children immediately — individual
 * screens gate on `hydrated` so the shell can paint right away.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrateData = useDataStore((s) => s.hydrate);
  const settingsTheme = useDataStore((s) => s.settings.theme);
  const dataHydrated = useDataStore((s) => s.hydrated);
  const hydrateTimer = useTimerStore((s) => s.hydrate);
  const hydrateHabits = useHabitsStore((s) => s.hydrate);
  const setTheme = useUiStore((s) => s.setTheme);
  const applyResolvedTheme = useUiStore((s) => s.applyResolvedTheme);

  // Hydrate stores once on mount.
  useEffect(() => {
    void hydrateData();
    void hydrateTimer();
    void hydrateHabits();
  }, [hydrateData, hydrateTimer, hydrateHabits]);

  // Mirror persisted theme into the UI store once data is ready.
  useEffect(() => {
    if (dataHydrated) setTheme(settingsTheme);
  }, [dataHydrated, settingsTheme, setTheme]);

  // React to OS theme changes when preference is "system".
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyResolvedTheme();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [applyResolvedTheme]);

  return <AuthProvider>{children}</AuthProvider>;
}
