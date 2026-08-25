"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

// One-off admin tool: pulls the freshly-generated Canva infographic exports
// for the "Claude for Virtual Assistants" pilot course into permanent
// Supabase Storage and attaches them to their lessons. Canva's export URLs
// are short-lived signed links, so this has to run once, soon after
// generation — not meant to be a permanent fixture of the admin area.
const IMPORTS: { lessonId: string; title: string; sourceUrl: string }[] = [
  {
    lessonId: "c25e5e15-ba98-49e2-9d13-4c03def63b43",
    title: "What Makes Claude Different from ChatGPT (regenerated — larger sub-text)",
    sourceUrl:
      "https://export-download.canva.com/Az3Ng/DAHTRmAz3Ng/-1/0/0001-5991427179932681713.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T024110Z&X-Amz-Expires=19461&X-Amz-Signature=458ee09c7f97f7b725aa44ccc77536e51ff00ced2c623d929d0af1c032fa79cb&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2008%3A05%3A31%20GMT",
  },
  {
    lessonId: "b0067b1f-8a24-46bd-afff-2f370b6770c6",
    title: "Long-Document Analysis and Summarization (regenerated — was illegible/garbled)",
    sourceUrl:
      "https://export-download.canva.com/0p9P8/DAHTRj0p9P8/-1/0/0001-5185282846486197200.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T212327Z&X-Amz-Expires=36845&X-Amz-Signature=364b04c419ec9fed281aa46894a20bf78a7e63e3658e9b8b9879e1572a27ec58&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2007%3A37%3A32%20GMT",
  },
  {
    lessonId: "55047f54-7a40-4e77-9df2-5cb606064501",
    title: "Using Claude for Client Research (regenerated — larger sub-text)",
    sourceUrl:
      "https://export-download.canva.com/UBUKA/DAHTRiUBUKA/-1/0/0001-1288543266632397819.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T071533Z&X-Amz-Expires=90917&X-Amz-Signature=960e8685a00eae319595da872913f54693d6917d05ff9bacbdacd511967c80cb&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2008%3A30%3A50%20GMT",
  },
  {
    lessonId: "87a51baa-1aa0-4bd6-98ce-b3b0391f3fec",
    title: "Claude Projects for Ongoing Client Work (regenerated — larger sub-text)",
    sourceUrl:
      "https://export-download.canva.com/cB_Dg/DAHTRrcB_Dg/-1/0/0001-3183432811570806635.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T111036Z&X-Amz-Expires=76865&X-Amz-Signature=3c7196dc7b18619b3837b8b189ff5a837bc3466b1956ce3bf0b81dfb9ed847d9&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2008%3A31%3A41%20GMT",
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
        One-off tool: pulls the 6 pilot-course Canva exports into permanent storage. Safe to run more than
        once (upserts).
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
