"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const router = useRouter();
  const { loading, userId, isAdmin, signOut } = useAuth();
  const signedIn = !loading && !!userId;

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-black bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-tight text-foreground/70 md:flex">
          <Link href="/tools" className="hover:text-foreground">Tool Directory</Link>
          <Link href="/courses" className="hover:text-foreground">Courses</Link>
          <Link href="/paths" className="hover:text-foreground">Paths</Link>
          <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Link href={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button
                size="sm"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
