"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

// One-off admin tool: pulls the freshly-generated Canva infographic exports
// for the "Claude Essentials" course into permanent Supabase Storage and
// attaches them to their lessons. Canva's export URLs are short-lived signed
// links, so this has to run once, soon after generation — not meant to be a
// permanent fixture of the admin area.
const IMPORTS: { lessonId: string; title: string; sourceUrl: string }[] = [
  {
    lessonId: "c25e5e15-ba98-49e2-9d13-4c03def63b43",
    title: "Chat vs. Cowork: Picking the Right Mode",
    sourceUrl:
      "https://export-download.canva.com/PvQ6M/DAHTQtPvQ6M/-1/0/0001-6180578428304382230.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T191849Z&X-Amz-Expires=12174&X-Amz-Signature=8a746e3907e79fa9e670d1a36cba11ed7602b3b43b0bb43575cfe67a4688f165&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2022%3A41%3A43%20GMT",
  },
  {
    lessonId: "b0067b1f-8a24-46bd-afff-2f370b6770c6",
    title: "Creating and Using Projects, Step by Step",
    sourceUrl:
      "https://export-download.canva.com/0p9P8/DAHTRj0p9P8/-1/0/0001-10646937335003709.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T225934Z&X-Amz-Expires=87083&X-Amz-Signature=76085b7b5e85bd9aa7f0a830d4555a0b286cf92c88d3ceb46bfbaa85b694a8b3&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2023%3A10%3A57%20GMT",
  },
  {
    lessonId: "55047f54-7a40-4e77-9df2-5cb606064501",
    title: "Connectors: Linking Your Apps to Claude",
    sourceUrl:
      "https://export-download.canva.com/UBUKA/DAHTRiUBUKA/-1/0/0001-7795118894052196209.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T023506Z&X-Amz-Expires=73713&X-Amz-Signature=d09fdb02baaba37a200a08b000edced4be2d3616ac25f3755af26e62e6424b70&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2023%3A03%3A39%20GMT",
  },
  {
    lessonId: "87a51baa-1aa0-4bd6-98ce-b3b0391f3fec",
    title: "Claude Cowork: A Step-by-Step Walkthrough",
    sourceUrl:
      "https://export-download.canva.com/cB_Dg/DAHTRrcB_Dg/-1/0/0001-1371859926995078526.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T015546Z&X-Amz-Expires=73856&X-Amz-Signature=ede70810e2ace0663e926d88b07bb3f9846253839466c2bfeff39ea56eb762a2&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2022%3A26%3A42%20GMT",
  },
  {
    lessonId: "68c7f2f4-d918-44cc-8a7a-8e9842a94b1d",
    title: "Putting It Together: A Full Collaboration Workflow",
    sourceUrl:
      "https://export-download.canva.com/auyzg/DAHTRBauyzg/-1/0/0001-4441063072268577083.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T120439Z&X-Amz-Expires=40515&X-Amz-Signature=6ac0545ba9d0bc4a19af7859802bad7499720591ff04fdd79ce03f6b56b8b44b&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2023%3A19%3A54%20GMT",
  },
  {
    lessonId: "45647807-41b4-4421-b482-207dd831c576",
    title: "Cowork Permissions, Safety, and Daily Habits",
    sourceUrl:
      "https://export-download.canva.com/iMyGo/DAHTRNiMyGo/-1/0/0001-6234621623297824191.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T021220Z&X-Amz-Expires=73518&X-Amz-Signature=64fe39f8344956d7c3a27cb2b3ba0dfc96fb08008b3c72b780379f644e2ca04c&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2022%3A37%3A38%20GMT",
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
        (upserts). All 6 Claude Essentials lessons are listed here after the step-by-step content
        rewrite.
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
