"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, BookOpen, Route, ShieldCheck, Eye } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { usePreviewMode } from "@/lib/preview-mode-context";

// Each nav item keeps its own icon color, active or not — a fixed color
// per destination reads faster at a glance than a monochrome icon set.
const learnerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "text-primary" },
  { href: "/tools", label: "Tool Directory", icon: Wrench, color: "text-orange-500" },
  { href: "/courses", label: "Courses", icon: BookOpen, color: "text-accent" },
  { href: "/paths", label: "Paths", icon: Route, color: "text-emerald-500" },
];

const adminOnlyLink = {
  href: "/admin",
  // Just "Overview" — the "Admin mode" badge above and the dark sidebar
  // theme already say "you're in the admin view," so repeating "Admin" in
  // the nav label itself was redundant.
  label: "Overview",
  icon: ShieldCheck,
  color: "text-violet-400",
};
// Everything but "Overview" — admins get their own landing page
// (Overview, above) instead, and can still reach the learner
// dashboard via "Preview as Learner" below when they actually want it.
const adminCatalogLinks = learnerLinks.filter((link) => link.href !== "/dashboard");

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  // Session-wide state (not a query param) — only flips when the admin
  // explicitly clicks "Preview as Learner" here, or "Back to Admin" in
  // PreviewModeBanner, and stays put across navigation to /tools, /courses,
  // /paths, etc.
  const { previewingAsLearner, enterPreview } = usePreviewMode();
  const adminMode = isAdmin && !previewingAsLearner;

  const links = adminMode ? [adminOnlyLink, ...adminCatalogLinks] : learnerLinks;

  return (
    <aside
      className={`hidden w-56 shrink-0 flex-col border-r-2 border-black p-4 md:flex ${
        // Fixed dark colors here, not the theme-reactive foreground/background
        // tokens — the Admin sidebar is meant to look distinctly dark as an
        // "you're in admin mode" signal regardless of whether the site's own
        // light/dark theme is on, so it shouldn't flip to light just because
        // the user has dark mode enabled.
        adminMode ? "bg-zinc-900 text-zinc-50" : ""
      }`}
    >
      <div>
        {/* Not a link — the marketing landing page ("/") isn't part of the
            signed-in app, so the logo here is just a wordmark, not a way
            back out to it. Overview (or Admin Overview) is the actual
            "home" for a signed-in user. */}
        <div className="mb-2 flex items-center px-3 py-2">
          <Logo size="sm" />
        </div>

        {adminMode && (
          <div className="mb-4 px-3">
            <Badge variant="purple">Admin mode</Badge>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon, color }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight transition-colors ${
                  adminMode
                    ? active
                      ? "bg-white text-zinc-900"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Only the entry point lives here — once previewing, the exit
            ("Back to Admin") lives in PreviewModeBanner instead, which stays
            visible on every page instead of just being reachable from the
            sidebar. Having both was redundant. */}
        {isAdmin && adminMode && (
          <div className="mt-4 border-t-2 border-white/20 pt-4">
            <Link
              href="/dashboard"
              onClick={enterPreview}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Eye className="h-4 w-4 text-sky-400" />
              Preview as Learner
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
