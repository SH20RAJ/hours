"use client";

import { useEffect, useState } from "react";

/**
 * Re-renders on an interval so timestamp-derived displays (the live timer) stay
 * current. Returns the current epoch ms. Also ticks immediately when the tab
 * regains focus, so a backgrounded/throttled tab snaps to the correct time.
 *
 * We intentionally derive elapsed time from timestamps elsewhere — this hook
 * only forces re-renders; it never accumulates time itself.
 */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, intervalMs]);

  return now;
}
