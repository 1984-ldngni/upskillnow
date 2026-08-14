import { NextResponse } from "next/server";
import { isMayaWebhookIp, mapPaymentMethod, type MayaPayment } from "@/lib/maya";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Maya restricts webhook delivery to its own fixed IPs instead of signing
// requests with a shared secret. Behind Vercel the real client IP arrives
// via x-forwarded-for (the first entry is the original client), not the
// raw socket address.
function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  if (!isMayaWebhookIp(clientIp)) {
    console.warn("Rejected webhook from unrecognized IP:", clientIp);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: MayaPayment;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = payload.id;
  const paymentStatus = payload.paymentStatus;
  if (!paymentId || !paymentStatus) {
    return NextResponse.json({ error: "Missing id or paymentStatus" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  // Idempotency: Maya retries undelivered webhooks up to 4 times, and the
  // same payment id legitimately gets multiple different statuses over its
  // life (e.g. AUTHORIZED then PAYMENT_SUCCESS) — so the dedupe key is the
  // (paymentId, paymentStatus) pair, not paymentId alone.
  const { data: existingEvent } = await supabase
    .from("payment_events")
    .select("id")
    .eq("maya_payment_id", paymentId)
    .eq("payment_status", paymentStatus)
    .maybeSingle();

  if (existingEvent) {
    // Already processed this exact event — acknowledge and stop, no-op.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Resolve which user/plan this payment belongs to via the checkout
  // session recorded when the checkout was created (see app/api/billing/
  // checkout/route.ts) — more reliable than trusting echoed-back metadata.
  const requestReferenceNumber = payload.requestReferenceNumber;
  const { data: session } = requestReferenceNumber
    ? await supabase
        .from("checkout_sessions")
        .select("user_id, plan, currency")
        .eq("request_reference_number", requestReferenceNumber)
        .maybeSingle()
    : { data: null };

  await supabase.from("payment_events").insert({
    maya_payment_id: paymentId,
    payment_status: paymentStatus,
    user_id: session?.user_id ?? null,
    raw_payload: payload,
  });

  if (!session) {
    // No matching checkout session — log it (above) for troubleshooting,
    // but there's nothing to activate. Can happen for test/replayed events
    // that don't correspond to a real checkout this app created.
    console.warn("Webhook payment has no matching checkout_session:", paymentId, requestReferenceNumber);
    return NextResponse.json({ ok: true, unmatched: true });
  }

  const paymentMethod = mapPaymentMethod(payload.fundSource?.type);

  if (paymentStatus === "PAYMENT_SUCCESS") {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").upsert(
      {
        user_id: session.user_id,
        plan: session.plan,
        currency: session.currency,
        status: "active",
        payment_method: paymentMethod,
        maya_payment_id: paymentId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    await supabase.from("profiles").update({ plan: session.plan }).eq("id", session.user_id);
  } else if (paymentStatus === "PAYMENT_FAILED") {
    await supabase
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("user_id", session.user_id);
    // Plan is intentionally left as-is here rather than downgraded
    // immediately — a grace period (recommended 3-5 days in the
    // implementation plan, not yet confirmed by the business owner) before
    // dropping to free is friendlier than yanking access on the first
    // failed charge. Actually enforcing that grace period needs a
    // scheduled job (e.g. a Vercel Cron route checking for past_due
    // subscriptions older than N days), not implemented yet.
  } else if (paymentStatus === "PAYMENT_CANCELLED") {
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("user_id", session.user_id);
    // Plan downgrade happens at period end (via the same scheduled job
    // noted above), not immediately — the user keeps what they paid for.
  }
  // PAYMENT_EXPIRED and AUTHORIZED: no plan change. Expired means the
  // checkout was abandoned before paying; authorized (card holds) precedes
  // the eventual PAYMENT_SUCCESS/PAYMENT_FAILED event for card payments.

  return NextResponse.json({ ok: true });
}
