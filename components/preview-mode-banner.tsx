"use client";

import Link from "next/link";
import { usePreviewMode } from "@/lib/preview-mode-context";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

// Shown on every signed-in page (via AppShell + /dashboard directly) while
// an admin is previewing as a learner — not just /dashboard — so the exit
// path is always visible no matter where they navigate. This is also now
// the only "Back to Admin" control; the sidebar's copy of it was redundant
// with this banner and was removed.
export function PreviewModeBanner() {
  const { previewingAsLearner, exitPreview } = usePreviewMode();

  if (!previewingAsLearner) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-black bg-amber-300 px-6 py-2 text-sm text-black">
      <div className="flex items-center gap-2 font-bold">
        <ShieldCheck className="h-4 w-4 text-violet-600" />
        You're previewing the learner dashboard as an admin.
      </div>
      <Link href="/admin" onClick={exitPreview}>
        <Button size="sm" variant="outline" className="border-black bg-white text-black hover:bg-black hover:text-white">
          Back to Admin
        </Button>
      </Link>
    </div>
  );
}
