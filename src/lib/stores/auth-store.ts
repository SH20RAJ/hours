"use client";

import { create } from "zustand";

/**
 * Minimal structural shape of the signed-in user. Stack Auth's CurrentUser
 * satisfies this, but typing it structurally keeps the store decoupled from the
 * Stack SDK so the rest of the app never imports Stack types directly.
 */
export interface AuthUser {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl?: string | null;
  getAccessToken: () => Promise<string | null>;
  signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
}

interface AuthState {
  /** The current user, or null when signed out / auth disabled. */
  user: AuthUser | null;
  /** True once the auth layer has resolved its initial state. */
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
  setReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user, ready: true }),
  setReady: (ready) => set({ ready }),
}));

/** Read the current access token outside React (used by the sync engine). */
export async function getAccessTokenSafe(): Promise<string | null> {
  const user = useAuthStore.getState().user;
  if (!user) return null;
  try {
    return await user.getAccessToken();
  } catch {
    return null;
  }
}
