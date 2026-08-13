import Link from "next/link";
import { LayoutDashboard, Wrench, BookOpen, ShieldCheck } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tools", label: "Tool Directory", icon: Wrench },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r-2 border-black p-4 md:block">
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
    </aside>
  );
}
