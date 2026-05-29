"use client";

import { useEffect, useState } from "react";
import { StackHandler } from "@stackframe/react";
import { isAuthConfigured } from "@/lib/auth/stack-client";

/**
 * Renders Stack Auth's handler for the current sub-route (sign-in, oauth
 * callback, etc.). `StackHandler` needs the live pathname, which only exists in
 * the browser — so we wait for mount before rendering it. When auth isn't
 * configured, there's no provider above us, so we show a gentle fallback rather
 * than calling Stack hooks that would throw.
 */
export function HandlerClient() {
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    setLocation(window.location.pathname);
  }, []);

  if (!isAuthConfigured) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">Accounts aren&apos;t enabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hours works fully offline without an account. Sign-in becomes available
          once Stack Auth credentials are configured.
        </p>
      </div>
    );
  }

  if (!location) return null;

  return <StackHandler fullPage location={location} />;
}
