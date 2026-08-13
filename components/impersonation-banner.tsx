"use client";

import { useImpersonation } from "@/lib/impersonation-context";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export function ImpersonationBanner() {
  const { impersonatingUser, stopImpersonation } = useImpersonation();

  if (!impersonatingUser) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-black bg-accent px-6 py-2 text-sm font-bold uppercase tracking-tight text-accent-foreground">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Viewing as {impersonatingUser.name} (read-only troubleshooting mode)
      </div>
      <Button size="sm" variant="secondary" onClick={stopImpersonation}>
        Exit impersonation
      </Button>
    </div>
  );
}
