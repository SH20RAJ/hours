"use client";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileHeader } from "./mobile-header";
import { useDataStore } from "@/lib/stores/data-store";
import { AlertTriangle } from "lucide-react";

/**
 * Top-level layout: sidebar on desktop, header + bottom nav on mobile. Content
 * is centered with a comfortable max width and gets bottom padding so the mobile
 * nav never overlaps the last element.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const dbAvailable = useDataStore((s) => s.dbAvailable);

  return (
    <div className="min-h-[100dvh]">
      <DesktopSidebar />
      <MobileHeader />

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 lg:max-w-4xl lg:px-8 lg:pb-10 lg:pt-8">
          {!dbAvailable && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-medium text-foreground">
                  Local storage unavailable
                </p>
                <p className="text-muted-foreground">
                  Your browser is blocking IndexedDB (often private mode). You can
                  explore the app, but nothing will be saved.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
