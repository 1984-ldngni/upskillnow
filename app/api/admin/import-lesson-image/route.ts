import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// One-off admin utility: given a lesson ID and a source image URL (e.g. a
// freshly-exported Canva design), fetches the image server-side (Vercel has
// normal internet access, unlike the sandbox this was built from), stores it
// permanently in the `lesson-images` Supabase Storage bucket, and points the
// lesson's `image_url` column at the resulting public URL.
//
// Exists because Canva's export URLs are short-lived signed S3 links (a few
// hours), not something safe to store directly in the database. Reuses
// CRON_SECRET as a lightweight shared secret rather than inventing a new
// admin auth mechanism for what's a rarely-used bulk-import tool — not a
// user-facing route.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { lessonId?: string; sourceUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId, sourceUrl } = body;
  if (!lessonId || !sourceUrl) {
    return NextResponse.json({ error: "lessonId and sourceUrl are required" }, { status: 400 });
  }

  try {
    const imageRes = await fetch(sourceUrl);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch source image: ${imageRes.status}` },
        { status: 502 }
      );
    }
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const contentType = imageRes.headers.get("content-type") ?? "image/png";

    const supabase = getServiceRoleClient();
    const path = `${lessonId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("lesson-images")
      .upload(path, buffer, { contentType, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("lesson-images").getPublicUrl(path);
    const imageUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("lessons")
      .update({ image_url: imageUrl })
      .eq("id", lessonId);

    if (updateError) {
      return NextResponse.json({ error: `DB update failed: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
