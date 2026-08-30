import { NextResponse } from "next/server";
import { getServiceRoleClient, getUserFromAccessToken } from "@/lib/supabase/server";
import { synthesizeSpeechBase64 } from "@/lib/google-tts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// One-off admin utility for producing the Watch tab's per-step narration
// clips: given an array of script lines, synthesizes each via Google Cloud
// Text-to-Speech server-side (Vercel has normal internet access, unlike the
// sandbox this was built from, which is network-allowlisted and can't reach
// googleapis.com directly) and returns the raw MP3 bytes as base64. These
// are intermediate production assets (one per lesson step, assembled into
// the final video with ffmpeg) rather than something stored in Supabase —
// nothing here writes to the DB.
//
// Auth: same pattern as import-lesson-image — CRON_SECRET or a signed-in
// admin's bearer token.
async function isAuthorized(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;

  const secret = process.env.CRON_SECRET;
  if (secret && token === secret) return true;

  const user = await getUserFromAccessToken(token);
  if (!user) return false;
  const supabase = getServiceRoleClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin";
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { texts?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { texts } = body;
  if (!Array.isArray(texts) || texts.length === 0 || !texts.every((t) => typeof t === "string" && t.trim())) {
    return NextResponse.json({ error: "texts must be a non-empty array of non-empty strings" }, { status: 400 });
  }
  if (texts.length > 20) {
    return NextResponse.json({ error: "Max 20 texts per request" }, { status: 400 });
  }

  try {
    const audioBase64 = await Promise.all(texts.map((t) => synthesizeSpeechBase64(t)));
    return NextResponse.json({ success: true, audioBase64 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
