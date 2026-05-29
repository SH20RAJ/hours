"use client";

import { create } from "zustand";
import type { ThemePreference } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "success" | "error";
}

/** Variant is optional when firing a toast; defaults to "default". */
export type ToastInput = Omit<Toast, "id" | "variant"> & {
  variant?: Toast["variant"];
};

interface UiState {
  toasts: Toast[];
  toast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;

  /** The user's theme preference, mirrored from settings for instant toggling. */
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
  applyResolvedTheme: () => void;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: ThemePreference): "light" | "dark" {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],

  toast: (input) => {
    const t: Toast = { variant: "default", ...input, id: uid() };
    set((s) => ({ toasts: [...s.toasts, t] }));
    // Auto-dismiss after 4s.
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismissToast(t.id), 4000);
    }
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  theme: "dark",
  resolvedTheme: "dark",

  setTheme: (theme) => {
    set({ theme, resolvedTheme: resolve(theme) });
    applyThemeClass(resolve(theme));
    // Mirror the preference to localStorage so the pre-paint script in the
    // root layout can apply the right theme before React hydrates (Dexie is
    // async and can't run before first paint).
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("hours-theme", JSON.stringify(theme));
      } catch {
        /* storage may be unavailable in private mode */
      }
    }
  },

  applyResolvedTheme: () => {
    const resolved = resolve(get().theme);
    set({ resolvedTheme: resolved });
    applyThemeClass(resolved);
  },
}));

function applyThemeClass(resolved: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/** Convenience helper so any module can fire a toast without importing the hook. */
export function toast(input: ToastInput): void {
  useUiStore.getState().toast(input);
}
