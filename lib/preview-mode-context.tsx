"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Tracks whether an admin is currently "Preview as Learner"-ing. This used
// to live only as a ?preview=1 query param on /dashboard, which meant it
// silently reset back to admin the moment they clicked into /tools,
// /courses, or /paths (none of those carry the query param) — so the
// preview would drop out from under them without ever clicking "Back to
// Admin." Session-wide state fixes that: it only changes when they
// explicitly click "Preview as Learner" or "Back to Admin," and survives
// navigation and page reloads (via sessionStorage) until they do.
type PreviewModeState = {
  previewingAsLearner: boolean;
  // False until the sessionStorage read on mount completes. Pages that
  // redirect admins away based on previewingAsLearner should wait for this
  // — otherwise a hard reload while previewing would briefly read
  // previewingAsLearner as false and redirect to /admin before the stored
  // value has a chance to load.
  loading: boolean;
  enterPreview: () => void;
  exitPreview: () => void;
};

const PreviewModeContext = createContext<PreviewModeState | undefined>(undefined);
const STORAGE_KEY = "upskillnow-preview-as-learner";

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  const [previewingAsLearner, setPreviewingAsLearner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPreviewingAsLearner(window.sessionStorage.getItem(STORAGE_KEY) === "1");
    setLoading(false);
  }, []);

  function enterPreview() {
    setPreviewingAsLearner(true);
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  }

  function exitPreview() {
    setPreviewingAsLearner(false);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <PreviewModeContext.Provider value={{ previewingAsLearner, loading, enterPreview, exitPreview }}>
      {children}
    </PreviewModeContext.Provider>
  );
}

export function usePreviewMode() {
  const ctx = useContext(PreviewModeContext);
  if (!ctx) throw new Error("usePreviewMode must be used within PreviewModeProvider");
  return ctx;
}
