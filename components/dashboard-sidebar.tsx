"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Wrench, BookOpen, ShieldCheck, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const baseLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tools", label: "Tool Directory", icon: Wrench },
  { href: "/courses", label: "Courses", icon: BookOpen },
];

export function DashboardSidebar() {
  const router = useRouter();
  const { isAdmin, signOut } = useAuth();
  const links = isAdmin
    ? [...baseLinks, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : baseLinks;

  return (
    <aside className="hidden w-56 shrink-0 flex-col justify-between border-r-2 border-black p-4 md:flex">
      <div>
        <Link
          href="/"
          className="mb-4 flex items-center gap-2 rounded-md px-3 py-2 font-heading text-sm font-extrabold hover:bg-secondary"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-black bg-primary shadow-brutal-sm">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </span>
          UpSkillNow
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-foreground/70 hover:bg-secondary hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-tight text-foreground/70 hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
