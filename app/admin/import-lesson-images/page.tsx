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
    title: "What Makes Claude Different from ChatGPT",
    sourceUrl:
      "https://export-download.canva.com/PvQ6M/DAHTQtPvQ6M/-1/0/0001-4818239460824143537.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T100013Z&X-Amz-Expires=66555&X-Amz-Signature=37bd678f4151cad8ee00133625c4f9037b4acc434caebe0a60059580ce840272&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2004%3A29%3A28%20GMT",
  },
  {
    lessonId: "b0067b1f-8a24-46bd-afff-2f370b6770c6",
    title: "Long-Document Analysis and Summarization",
    sourceUrl:
      "https://export-download.canva.com/p6XOI/DAHTRIp6XOI/-1/0/0001-9052749018371878264.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T232827Z&X-Amz-Expires=21760&X-Amz-Signature=51d9ad36d9141d2e2be3b319ebb78aef55862b6d850baa12fb4acd2213bd648e&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2005%3A31%3A07%20GMT",
  },
  {
    lessonId: "55047f54-7a40-4e77-9df2-5cb606064501",
    title: "Using Claude for Client Research",
    sourceUrl:
      "https://export-download.canva.com/Yicww/DAHTRMYicww/-1/0/0001-8512317061218982263.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260825T011656Z&X-Amz-Expires=17590&X-Amz-Signature=a6b536ae4a7563fe907c6a42a72c9708d82cbef74dbbf1d68bcc34db6d5f9276&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2006%3A10%3A06%20GMT",
  },
  {
    lessonId: "87a51baa-1aa0-4bd6-98ce-b3b0391f3fec",
    title: "Claude Projects for Ongoing Client Work",
    sourceUrl:
      "https://export-download.canva.com/asWSQ/DAHTRNasWSQ/-1/0/0001-7699417327386040923.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T205621Z&X-Amz-Expires=32099&X-Amz-Signature=eed1501a01a482de6a6742a30ef44d14f8030c3db32948081d5f1b4a82321f88&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2005%3A51%3A20%20GMT",
  },
  {
    lessonId: "68c7f2f4-d918-44cc-8a7a-8e9842a94b1d",
    title: "Analyzing Contracts and Documents Safely",
    sourceUrl:
      "https://export-download.canva.com/auyzg/DAHTRBauyzg/-1/0/0001-3183432802023952568.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T102148Z&X-Amz-Expires=72435&X-Amz-Signature=4aef675a67ec3a5159c09008e69df27cc9e31be10def5397e74f30b5b449cee2&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2006%3A29%3A03%20GMT",
  },
  {
    lessonId: "45647807-41b4-4421-b482-207dd831c576",
    title: "Advanced Prompting for Nuanced Writing",
    sourceUrl:
      "https://export-download.canva.com/iMyGo/DAHTRNiMyGo/-1/0/0001-6931553592316418337.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260824T170500Z&X-Amz-Expires=48909&X-Amz-Signature=0af324abebf0b62eb0e1185c29e547e6d6ee86564982ac94ed602bf44c5e6734&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Tue%2C%2025%20Aug%202026%2006%3A40%3A09%20GMT",
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
