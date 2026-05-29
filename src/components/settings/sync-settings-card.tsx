"use client";

import { RefreshCw, LogIn, CheckCircle2, AlertTriangle, CloudOff } from "lucide-react";import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSyncStore } from "@/lib/stores/sync-store";
import { isAuthConfigured, isSyncConfigured } from "@/lib/auth/stack-client";
import { syncNow } from "@/lib/sync/sync-engine";
import { toast } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

/**
 * Settings panel for cloud sync. Adapts to three states: auth not configured in
 * this build, signed out, and signed in. Shows last-sync time and live status.
 */
export function SyncSettingsCard() {
  const user = useAuthStore((s) => s.user);
  const status = useSyncStore((s) => s.status);
  const error = useSyncStore((s) => s.error);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);

  // Build has no auth credentials — sync is unavailable entirely.
  if (!isAuthConfigured) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
        <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Sync isn&apos;t enabled</p>
          <p className="text-sm text-muted-foreground">
            Hours runs fully on this device. Cloud sync turns on once Stack Auth
            credentials are configured for this deployment.
          </p>
        </div>
      </div>
    );
  }

  // Configured but signed out.
  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sign in to back up your data and sync it across devices. Your local data
          stays put and merges with the cloud on your first sync.
        </p>
        <Button asChild>
          <Link href="/handler/sign-in">
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  async function handleSync() {
    await syncNow();
    const s = useSyncStore.getState();
    if (s.status === "success") toast({ title: "Synced", variant: "success" });
    else if (s.status === "error") {
      toast({ title: "Sync failed", description: s.error ?? undefined, variant: "error" });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            Signed in as {user.displayName ?? user.primaryEmail ?? "you"}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <StatusDot status={status} />
            {statusLabel(status, lastSyncedAt, error)}
          </p>
        </div>
        {isSyncConfigured && (
          <Button onClick={handleSync} disabled={status === "syncing"}>
            <RefreshCw className={cn("h-4 w-4", status === "syncing" && "animate-spin")} />
            {status === "syncing" ? "Syncing…" : "Sync now"}
          </Button>
        )}
      </div>

      {!isSyncConfigured && (
        <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
          You&apos;re signed in, but no sync endpoint is configured
          (NEXT_PUBLIC_SYNC_API_URL). Data won&apos;t leave this device yet.
        </p>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => void user.signOut({ redirectUrl: "/" })}
      >
        Sign out
      </Button>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (status === "error") return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        status === "syncing" ? "animate-pulse bg-primary" : "bg-muted-foreground/50",
      )}
    />
  );
}

function statusLabel(status: string, lastSyncedAt: string | null, error: string | null): string {
  if (status === "syncing") return "Syncing your data…";
  if (status === "error") return error ?? "Last sync failed";
  if (lastSyncedAt) {
    try {
      return `Last synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`;
    } catch {
      return "Synced";
    }
  }
  return "Not synced yet";
}
