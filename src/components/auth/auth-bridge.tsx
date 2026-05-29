"use client";

import { useEffect } from "react";
import { useUser } from "@stackframe/react";
import { useAuthStore, type AuthUser } from "@/lib/stores/auth-store";

/**
 * Bridges Stack Auth's `useUser()` into our framework-agnostic auth store.
 * Rendered ONLY inside `StackProvider` (so the hook is always valid). The rest
 * of the app reads `useAuthStore` and never imports Stack hooks, keeping the
 * SDK dependency isolated to this file and the provider.
 */
export function AuthBridge() {
  // `useUser` suspends while loading; the parent Suspense boundary handles it.
  const user = useUser();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!user) {
      setUser(null);
      return;
    }
    const mapped: AuthUser = {
      id: user.id,
      displayName: user.displayName ?? null,
      primaryEmail: user.primaryEmail ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      getAccessToken: async () => {
        return (await user.getAccessToken()) ?? null;
      },
      signOut: (opts) => user.signOut(opts),
    };
    setUser(mapped);
  }, [user, setUser]);

  return null;
}
