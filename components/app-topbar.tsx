"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/notification-bell";

// Sits above the main content next to DashboardSidebar on every signed-in
// page. Houses the account menu (profile settings + sign out) so those
// actions live in one predictable, always-visible spot instead of buried at
// the bottom of the left nav.
export function AppTopbar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.fullName || profile?.email || "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center justify-end gap-3 border-b-2 border-black px-6 py-3">
      <NotificationBell />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-secondary font-heading text-sm font-black transition-colors hover:bg-secondary/70"
        >
          {initial}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border-2 border-black bg-card shadow-brutal">
            <div className="border-b-2 border-black px-4 py-3">
              <p className="truncate text-sm font-bold">{profile?.fullName || "Account"}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Settings className="h-4 w-4 text-primary" />
              Profile settings
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push("/");
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-destructive hover:bg-secondary"
            >
              <LogOut className="h-4 w-4 text-destructive" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
