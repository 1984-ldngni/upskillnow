"use client";

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { PreviewModeBanner } from "@/components/preview-mode-banner";
import { useAuth } from "@/lib/auth-context";

// Signed-out visitors get the marketing chrome (top nav + footer) so the
// catalog is still fully browsable pre-signup. Signed-in users get the same
// app shell as /dashboard and /admin (left sidebar), so the whole logged-in
// experience feels like one app instead of switching back to the landing
// page's header on every content page.
export function AppShell({
  children,
  maxWidth = "max-w-6xl",
  focusMode = false,
}: {
  children: ReactNode;
  maxWidth?: string;
  // Hides the sidebar, topbar, and preview banner so a content-heavy page
  // (e.g. a lesson) can use the full screen. The page itself is responsible
  // for rendering its own toggle to enter/exit this — AppShell just does
  // the hiding.
  focusMode?: boolean;
}) {
  const { loading, userId } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (userId && focusMode) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className={`mx-auto w-full flex-1 px-6 py-6 ${maxWidth}`}>{children}</main>
      </div>
    );
  }

  if (userId) {
    return (
      <div className="flex min-h-screen flex-col">
        <PreviewModeBanner />
        <div className="flex flex-1">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <AppTopbar />
            <main className={`mx-auto w-full flex-1 px-6 py-12 ${maxWidth}`}>{children}</main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={`mx-auto w-full flex-1 px-6 py-12 ${maxWidth}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}
