"use client";

import { useEffect } from "react";
import { logClientError } from "@/lib/error-logger";

// Catches anything that isn't already handled explicitly — a thrown error
// outside a try/catch, or a rejected promise nobody awaited. Both would
// otherwise just show up as a red console line the admin never sees.
export function GlobalErrorListener() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      logClientError(event.message || "Unhandled error", {
        context: {
          source: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";
      logClientError(message, { context: { type: "unhandledrejection" } });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
