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
    lessonId: "c25e5e15-ba98-49e2-9d13-4c03def63b43",
    title: "What Makes Claude Different from ChatGPT (removed 'Virtual Assistant' wording baked into image)",
    sourceUrl:
      "https://export-download.canva.com/PvQ6M/DAHTQtPvQ6M/-1/0/0001-8873730985665786354.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T214111Z&X-Amz-Expires=78373&X-Amz-Signature=5ee0e901105c4f60388a151fcfd986483c53204290b07e0dae971e879519fd20&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2019%3A27%3A24%20GMT",
  },
  {
    lessonId: "b0067b1f-8a24-46bd-afff-2f370b6770c6",
    title: "Long-Document Analysis and Summarization (removed 'virtual assistants' wording baked into image)",
    sourceUrl:
      "https://export-download.canva.com/0p9P8/DAHTRj0p9P8/-1/0/0001-66941917945438112.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T215603Z&X-Amz-Expires=78153&X-Amz-Signature=742ca9890a95dc45ade87f1e59ef53a5b5eaf5e001e8025f615b4e981cfe5107&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2019%3A38%3A36%20GMT",
  },
  {
    lessonId: "55047f54-7a40-4e77-9df2-5cb606064501",
    title: "Using Claude for Client Research (removed 'Essential Insights for VAs' wording baked into image)",
    sourceUrl:
      "https://export-download.canva.com/UBUKA/DAHTRiUBUKA/-1/0/0001-3252112753822669894.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T041749Z&X-Amz-Expires=54373&X-Amz-Signature=9aaff46c9b9ca5263205cf675d30939967c4b25d9b864558f210874ea268b3d1&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2019%3A24%3A02%20GMT",
  },
  {
    lessonId: "87a51baa-1aa0-4bd6-98ce-b3b0391f3fec",
    title: "Claude Projects for Ongoing Client Work (removed 'Essential Tips for Virtual Assistants' wording baked into image)",
    sourceUrl:
      "https://export-download.canva.com/cB_Dg/DAHTRrcB_Dg/-1/0/0001-2120583346786307753.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T154751Z&X-Amz-Expires=12635&X-Amz-Signature=25218a1bc090c663fb207628fb4ffa310582705984756db9d39802a5b7c6af23&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2019%3A18%3A26%20GMT",
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
        (upserts). Lessons 5 and 6 aren&apos;t listed here — their infographics were already clean of
        VA-specific wording and didn&apos;t need this fix.
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
