"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

// One-off admin tool: pulls the freshly-generated Canva infographic exports
// for the "Claude Essentials" pilot course into permanent
// Supabase Storage and attaches them to their lessons. Canva's export URLs
// are short-lived signed links, so this has to run once, soon after
// generation — not meant to be a permanent fixture of the admin area.
const IMPORTS: { lessonId: string; title: string; sourceUrl: string }[] = [
  {
    lessonId: "b0067b1f-8a24-46bd-afff-2f370b6770c6",
    title: "Long-Document Analysis and Summarization (body/caption text enlarged directly, not regenerated)",
    sourceUrl:
      "https://export-download.canva.com/0p9P8/DAHTRj0p9P8/-1/0/0001-5587229149577587110.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T171323Z&X-Amz-Expires=85618&X-Amz-Signature=6857a74c9f66895e8c6d9809b2baae80035d819d171bc91e602d105864a7cd34&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2017%3A00%3A21%20GMT",
  },
  {
    lessonId: "55047f54-7a40-4e77-9df2-5cb606064501",
    title: "Using Claude for Client Research (body/caption text enlarged directly, not regenerated)",
    sourceUrl:
      "https://export-download.canva.com/UBUKA/DAHTRiUBUKA/-1/0/0001-592737162589204995.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T004020Z&X-Amz-Expires=58871&X-Amz-Signature=00c168f64ff5b03582248cd7d9e136bad2df3e2264571fbec45fb38a196b9abf&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2017%3A01%3A31%20GMT",
  },
  {
    lessonId: "87a51baa-1aa0-4bd6-98ce-b3b0391f3fec",
    title: "Claude Projects for Ongoing Client Work (body/caption text enlarged directly, not regenerated)",
    sourceUrl:
      "https://export-download.canva.com/cB_Dg/DAHTRrcB_Dg/-1/0/0001-846064642219638932.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T230948Z&X-Amz-Expires=63594&X-Amz-Signature=5e938a4fdd582c7dbb2aea345f6b3a5ece914bc3b4ef88aeac49666740383705&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2016%3A49%3A42%20GMT",
  },
  {
    lessonId: "68c7f2f4-d918-44cc-8a7a-8e9842a94b1d",
    title: "Analyzing Contracts and Documents Safely (body/caption text enlarged directly, was never regenerated before)",
    sourceUrl:
      "https://export-download.canva.com/auyzg/DAHTRBauyzg/-1/0/0001-6259391393817498482.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T130052Z&X-Amz-Expires=14855&X-Amz-Signature=4fc433435eb20879df504ae2a9882c9c6cc9ce828506df403b151663315aecdb&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2017%3A08%3A27%20GMT",
  },
];

type Status = "pending" | "running" | "done" | "error";

export default function ImportLessonImagesPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, { status: Status; detail?: string }>>({});
  const [running, setRunning] = useState(false);

  if (!loading && !isAdmin) {
    router.push("/dashboard");
    return null;
  }

  async function runImport() {
    setRunning(true);
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setRunning(false);
      return;
    }

    for (const item of IMPORTS) {
      setStatuses((s) => ({ ...s, [item.lessonId]: { status: "running" } }));
      try {
        const res = await fetch("/api/admin/import-lesson-image", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ lessonId: item.lessonId, sourceUrl: item.sourceUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatuses((s) => ({ ...s, [item.lessonId]: { status: "error", detail: data.error ?? "Failed" } }));
        } else {
          setStatuses((s) => ({ ...s, [item.lessonId]: { status: "done", detail: data.imageUrl } }));
        }
      } catch (err: any) {
        setStatuses((s) => ({ ...s, [item.lessonId]: { status: "error", detail: err?.message ?? "Failed" } }));
      }
    }
    setRunning(false);
  }

  return (
    <AppShell maxWidth="max-w-2xl">
      <h1 className="font-heading text-2xl font-black">Import lesson infographics</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One-off tool: pulls the latest Canva exports into permanent storage. Safe to run more than once
        (upserts). Lessons 1 and 5 aren&apos;t listed here — their infographics already had large,
        readable text and didn&apos;t need this fix.
      </p>
      <Button className="mt-4" onClick={runImport} disabled={running}>
        {running ? "Running…" : "Run import"}
      </Button>
      <div className="mt-6 space-y-2">
        {IMPORTS.map((item) => {
          const s = statuses[item.lessonId];
          return (
            <div key={item.lessonId} className="rounded-md border-2 border-black p-3 text-sm">
              <p className="font-bold">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {s?.status === "done"
                  ? `Done: ${s.detail}`
                  : s?.status === "error"
                  ? `Error: ${s.detail}`
                  : s?.status === "running"
                  ? "Running…"
                  : "Not started"}
              </p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
