"use client";

import { useEffect, useState } from "react";
import { useDataStore } from "@/lib/stores/data-store";
import { useTimerStore } from "@/lib/stores/timer-store";

/**
 * True once both the data and timer stores have hydrated from IndexedDB. Pages
 * use this to swap skeletons for real content and avoid a hydration mismatch
 * (server renders nothing data-dependent).
 */
export function useHydrated(): boolean {
  const dataHydrated = useDataStore((s) => s.hydrated);
  const timerHydrated = useTimerStore((s) => s.hydrated);
  // Also gate on client mount so SSR markup matches the first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && dataHydrated && timerHydrated;
}
