"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/ui-store";

const iconFor = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
} as const;

const accentFor = {
  default: "text-foreground",
  success: "text-success",
  error: "text-destructive",
} as const;

/**
 * Global toaster. Reads transient toasts from the UI store and renders them in a
 * Radix region so they're announced to assistive tech. Positioned bottom-center
 * on mobile (clear of the nav) and bottom-right on desktop.
 */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
      {toasts.map((t) => {
        const Icon = iconFor[t.variant];
        return (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xl",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2",
              "data-[swipe=end]:animate-out data-[swipe=end]:fade-out-0",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", accentFor[t.variant])} />
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport
        className={cn(
          "fixed z-[100] flex max-h-screen w-full flex-col gap-2 p-4 outline-none",
          "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 sm:bottom-0 sm:left-auto sm:right-0 sm:translate-x-0",
          "sm:max-w-sm",
        )}
      />
    </ToastPrimitive.Provider>
  );
}
