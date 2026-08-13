"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logClientError } from "@/lib/error-logger";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError(error.message || "Unhandled render error", {
      context: { digest: error.digest, stack: error.stack?.slice(0, 1000) },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-black">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        That's on us, not you — it's been logged. Try again, or come back in a bit.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
