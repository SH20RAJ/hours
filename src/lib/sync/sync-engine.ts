"use client";

import { exportAllData } from "@/lib/db";
import { useDataStore } from "@/lib/stores/data-store";
import { getAccessTokenSafe, useAuthStore } from "@/lib/stores/auth-store";
import { useSyncStore } from "@/lib/stores/sync-store";
import { syncApiUrl, isSyncConfigured } from "@/lib/auth/stack-client";

interface ServerState {
  sessions: any[];
  categories: any[];
  goals: any[];
  settings: Record<string, any> | null;
}

interface SyncResponse {
  syncedAt: string;
  state: ServerState;
}

/**
 * Push local data to the sync API and apply the merged server state back.
 *
 * Merge strategy:
 *  - A *pristine* device (no sessions or goals yet — only default categories)
 *    pushes NOTHING. This avoids seeding the server with this device's default
 *    categories, which would duplicate the user's real categories from another
 *    device. It simply pulls server truth.
 *  - A device with real data push-merges; the server resolves conflicts by
 *    last-write-wins on `updatedAt` and returns the merged state.
 *
 * Known limitation: deletions don't propagate (no tombstones), so a row deleted
 * on one device can reappear from another device's push until manually removed.
 */
export async function syncNow(): Promise<void> {
  const sync = useSyncStore.getState();

  if (!isSyncConfigured) {
    sync.setStatus("error", "Sync isn't configured in this build.");
    return;
  }
  if (!useAuthStore.getState().user) {
    sync.setStatus("error", "Sign in to sync your data.");
    return;
  }

  const token = await getAccessTokenSafe();
  if (!token) {
    sync.setStatus("error", "Couldn't get an access token. Try signing in again.");
    return;
  }

  sync.setStatus("syncing");

  try {
    const data = useDataStore.getState();
    const pristine = data.isPristine();

    // Build the push payload. Pristine devices send an empty body to pull-only.
    const body = pristine
      ? {}
      : await exportAllData().then((p) => ({
          sessions: p.sessions,
          categories: p.categories,
          goals: p.goals,
          settings: p.settings,
        }));

    const res = await fetch(`${syncApiUrl.replace(/\/$/, "")}/api/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await safeError(res);
      throw new Error(detail || `Sync failed (${res.status})`);
    }

    const payload = (await res.json()) as SyncResponse;
    await useDataStore.getState().applyServerState({
      sessions: payload.state.sessions ?? [],
      categories: payload.state.categories ?? [],
      goals: payload.state.goals ?? [],
      settings: payload.state.settings
        ? {
            dailyTargetHours: payload.state.settings.dailyTargetHours ?? 6,
            weekStartsOn: payload.state.settings.weekStartsOn ?? 1,
            desiredIdentities: payload.state.settings.desiredIdentities ?? [],
            theme: payload.state.settings.theme ?? "dark",
          }
        : null,
    });

    sync.setLastSyncedAt(payload.syncedAt);
    sync.setStatus("success");
  } catch (err) {
    sync.setStatus(
      "error",
      err instanceof Error ? err.message : "Something went wrong during sync.",
    );
  }
}

async function safeError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? "";
  } catch {
    return "";
  }
}
