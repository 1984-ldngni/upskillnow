import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-black bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-black bg-primary shadow-brutal-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          UpSkillNow
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-tight text-foreground/70 md:flex">
          <Link href="/tools" className="hover:text-foreground">Tool Directory</Link>
          <Link href="/courses" className="hover:text-foreground">Courses</Link>
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/auth">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
