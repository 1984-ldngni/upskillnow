"use client";

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/lib/auth-context";

// Signed-out visitors get the marketing chrome (top nav + footer) so the
// catalog is still fully browsable pre-signup. Signed-in users get the same
// app shell as /dashboard and /admin (left sidebar), so the whole logged-in
// experience feels like one app instead of switching back to the landing
// page's header on every content page.
export function AppShell({
  children,
  maxWidth = "max-w-6xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  const { loading, userId } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (userId) {
    return (
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className={`mx-auto w-full flex-1 px-6 py-12 ${maxWidth}`}>{children}</main>
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
