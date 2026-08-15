import { NextResponse } from "next/server";
import { isMayaWebhookIp, mapPaymentMethod, type MayaPayment } from "@/lib/maya";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

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
        // Once real Vault auto-renewal is wired up, this is when the
        // renewal cron (app/api/cron/renew-subscriptions) should next try
        // charging the card on file. Reset on every successful payment,
        // whether it's the first charge or a renewal.
        next_billing_attempt_at: periodEnd.toISOString(),
        failed_renewal_attempts: 0,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    await supabase.from("profiles").update({ plan: session.plan }).eq("id", session.user_id);

    await createNotification({
      userId: session.user_id,
      type: "payment_success",
      title: "Payment received",
      body: `You're on the ${session.plan === "team" ? "Team" : "Pro"} plan now — full access is unlocked.`,
      link: "/settings?tab=billing",
      relatedId: paymentId,
    });
  } else if (paymentStatus === "PAYMENT_FAILED") {
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("failed_renewal_attempts")
      .eq("user_id", session.user_id)
      .maybeSingle();
    const attempts = (existingSub?.failed_renewal_attempts ?? 0) + 1;
    const retryAt = new Date();
    retryAt.setDate(retryAt.getDate() + 2);

    await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
        failed_renewal_attempts: attempts,
        next_billing_attempt_at: retryAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user_id);
    // Plan is intentionally left as-is here rather than downgraded
    // immediately — a short grace period (retrying every 2 days, up to 3
    // attempts) is friendlier than yanking access on the first failed
    // charge. app/api/cron/renew-subscriptions/route.ts is what actually
    // downgrades profiles.plan to free once attempts are exhausted (or
    // the subscription has no card on file to retry at all).

    await createNotification({
      userId: session.user_id,
      type: "payment_failed",
      title: "Payment didn't go through",
      body: "We'll try again in a couple days. Update your payment method in Settings if it keeps failing.",
      link: "/settings?tab=billing",
      relatedId: paymentId,
    });
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
