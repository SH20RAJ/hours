"use client";

import Link from "next/link";
import { LogIn, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSyncStore } from "@/lib/stores/sync-store";
import { isAuthConfigured, isSyncConfigured } from "@/lib/auth/stack-client";
import { syncNow } from "@/lib/sync/sync-engine";
import { toast } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

/**
 * Account control shown in the sidebar (and a compact variant in the mobile
 * header). Renders nothing when auth isn't configured, so the local-first build
 * shows no account UI at all. Reads the framework-agnostic auth store rather
 * than Stack hooks, so it's safe to mount anywhere.
 */
export function AuthMenu({ variant = "sidebar" }: { variant?: "sidebar" | "compact" }) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const syncStatus = useSyncStore((s) => s.status);

  if (!isAuthConfigured) return null;

  // Signed out — offer sign in.
  if (!user) {
    if (variant === "compact") {
      return (
        <Button variant="ghost" size="icon-sm" asChild aria-label="Sign in">
          <Link href="/handler/sign-in">
            <LogIn className="h-5 w-5" />
          </Link>
        </Button>
      );
    }
    return (
      <Button variant="secondary" className="w-full" asChild disabled={!ready}>
        <Link href="/handler/sign-in">
          <LogIn className="h-4 w-4" />
          Sign in to sync
        </Link>
      </Button>
    );
  }

  async function handleSync() {
    await syncNow();
    const { status, error } = useSyncStore.getState();
    if (status === "success") toast({ title: "Synced", variant: "success" });
    else if (status === "error") {
      toast({ title: "Sync failed", description: error ?? undefined, variant: "error" });
    }
  }

  const initials = (user.displayName ?? user.primaryEmail ?? "?")
    .slice(0, 1)
    .toUpperCase();

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        {isSyncConfigured && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            aria-label="Sync now"
          >
            <RefreshCw
              className={cn("h-5 w-5", syncStatus === "syncing" && "animate-spin")}
            />
          </Button>
        )}
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          title={user.displayName ?? user.primaryEmail ?? "Account"}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-border p-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {user.displayName ?? "Signed in"}
          </p>
          {user.primaryEmail && (
            <p className="truncate text-xs text-muted-foreground">
              {user.primaryEmail}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void user.signOut({ redirectUrl: "/" })}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      {isSyncConfigured && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleSync}
          disabled={syncStatus === "syncing"}
        >
          <RefreshCw
            className={cn("h-4 w-4", syncStatus === "syncing" && "animate-spin")}
          />
          {syncStatus === "syncing" ? "Syncing…" : "Sync now"}
        </Button>
      )}
    </div>
  );
}
