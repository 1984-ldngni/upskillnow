"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, BookOpen, Route, ShieldCheck, Eye } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

const learnerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tools", label: "Tool Directory", icon: Wrench },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/paths", label: "Paths", icon: Route },
];

const adminOnlyLink = { href: "/admin", label: "Admin Overview", icon: ShieldCheck };

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

  const links = adminMode ? [adminOnlyLink, ...learnerLinks] : learnerLinks;

  return (
    <aside
      className={`hidden w-56 shrink-0 flex-col border-r-2 border-black p-4 md:flex ${
        adminMode ? "bg-foreground text-background" : ""
      }`}
    >
      <div>
        <Link
          href="/"
          className={`mb-2 flex items-center rounded-md px-3 py-2 ${
            adminMode ? "hover:bg-background/10" : "hover:bg-secondary"
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
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight transition-colors ${
                  adminMode
                    ? active
                      ? "bg-background text-foreground"
                      : "text-background/70 hover:bg-background/10 hover:text-background"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className={`mt-4 border-t-2 pt-4 ${adminMode ? "border-background/20" : "border-black/20"}`}>
            {adminMode ? (
              <Link
                href="/dashboard?preview=1"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-background/70 hover:bg-background/10 hover:text-background"
              >
                <Eye className="h-4 w-4" />
                Preview as Learner
              </Link>
            ) : (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-foreground/70 hover:bg-secondary hover:text-foreground"
              >
                <ShieldCheck className="h-4 w-4" />
                Back to Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
