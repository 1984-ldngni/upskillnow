"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, BookOpen, Route, ShieldCheck, Eye } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

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
  label: "Admin Overview",
  icon: ShieldCheck,
  color: "text-violet-400",
};
// Everything but "Overview" — admins get their own landing page
// (Admin Overview, above) instead, and can still reach the learner
// dashboard via "Preview as Learner" below when they actually want it.
const adminCatalogLinks = learnerLinks.filter((link) => link.href !== "/dashboard");

export function DashboardSidebar({
  previewingAsLearner = false,
}: {
  // Only ever set by /dashboard when arrived at via the "Preview as Learner"
  // link (?preview=1) — every other page renders this with the default, so
  // an admin sees the same dark Admin sidebar no matter which page they're
  // on, instead of it flipping back to the learner look on anything that
  // isn't literally /admin.
  previewingAsLearner?: boolean;
}) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
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
        <Link
          href="/"
          className={`mb-2 flex items-center rounded-md px-3 py-2 ${
            adminMode ? "hover:bg-white/10" : "hover:bg-secondary"
          }`}
        >
          <Logo size="sm" />
        </Link>

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

        {isAdmin && (
          <div className={`mt-4 border-t-2 pt-4 ${adminMode ? "border-white/20" : "border-black/20"}`}>
            {adminMode ? (
              <Link
                href="/dashboard?preview=1"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <Eye className="h-4 w-4 text-sky-400" />
                Preview as Learner
              </Link>
            ) : (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-foreground/70 hover:bg-secondary hover:text-foreground"
              >
                <ShieldCheck className="h-4 w-4 text-violet-500" />
                Back to Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
