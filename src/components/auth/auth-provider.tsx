"use client";

import { Suspense } from "react";
import { StackProvider, StackTheme } from "@stackframe/react";
import { stackClientApp, isAuthConfigured } from "@/lib/auth/stack-client";
import { AuthBridge } from "./auth-bridge";

/**
 * Wraps the app in Stack Auth's provider ONLY when credentials are configured.
 * When unconfigured, it renders children untouched so the app runs fully
 * local-first with no auth dependency. Because `isAuthConfigured` is a
 * build-time constant, this branch is stable — we never conditionally call
 * Stack's hooks; we conditionally mount the provider subtree instead.
 *
 * `AuthBridge` lives inside the provider so its `useUser()` hook is always
 * valid; it mirrors the Stack session into our framework-agnostic auth store.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isAuthConfigured || !stackClientApp) {
    return <>{children}</>;
  }
  return (
    <Suspense fallback={null}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <AuthBridge />
          {children}
        </StackTheme>
      </StackProvider>
    </Suspense>
  );
}
