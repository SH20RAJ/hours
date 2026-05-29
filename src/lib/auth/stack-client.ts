"use client";

import { StackClientApp } from "@stackframe/react";

/**
 * Stack Auth client configuration.
 *
 * The whole auth + sync layer is OPTIONAL. Hours is local-first and fully usable
 * with no account. Auth only activates when both env vars below are present at
 * build time, so a default build (or a fork without credentials) keeps working
 * with zero login friction — matching the product's "no login required" promise.
 *
 * To enable auth, set these in `.env.local` (see `.env.example`):
 *   NEXT_PUBLIC_STACK_PROJECT_ID
 *   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
 */
const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

/** True only when Stack Auth credentials are configured at build time. */
export const isAuthConfigured = Boolean(projectId && publishableClientKey);

/** Optional separate sync API base URL (the D1-backed Worker). */
export const syncApiUrl = process.env.NEXT_PUBLIC_SYNC_API_URL ?? "";

/** True when both auth AND a sync endpoint are configured. */
export const isSyncConfigured = isAuthConfigured && Boolean(syncApiUrl);

/**
 * Singleton client app. Constructed only when configured; otherwise null so the
 * provider can no-op. Uses cookie token storage and Stack's hosted auth pages,
 * with our in-app `/handler` routes wired for the OAuth callback.
 */
export const stackClientApp: StackClientApp<true> | null = isAuthConfigured
  ? new StackClientApp({
      projectId: projectId!,
      publishableClientKey: publishableClientKey!,
      tokenStore: "cookie",
      urls: {
        // In-app handler routes (see app/handler/[...stack]).
        handler: "/handler",
        afterSignIn: "/",
        afterSignUp: "/",
        afterSignOut: "/",
      },
    })
  : null;
