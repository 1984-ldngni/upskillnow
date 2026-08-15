import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createCustomerPayment } from "@/lib/maya";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getPlan, type Currency, type PlanSlug } from "@/lib/pricing";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Runs daily via Vercel Cron (see vercel.json). Two jobs in one route since
// they're both "sweep subscriptions and react to expiry":
//
// 1. Renewal attempts — charge a subscription's vaulted card again once its
//    period ends, via Maya Vault's Create Customer Payment endpoint (no 3DS
//    needed on repeat charges in the common case). Currently a no-op in
//    practice: nothing sets subscriptions.maya_card_token_id yet, because
//    the card-capture checkout flow isn't built (see the "Card capture
//    form" note in Maya_Billing_Implementation_Plan.md for why — it needs
//    an exact field-name confirmation from Maya's API reference that
//    wasn't resolvable from the public docs). Once that's built, this loop
//    picks the renewals up automatically with no changes needed here.
// 2. Downgrade sweep — reverts profiles.plan to 'free' for anything whose
//    paid access should have ended: a canceled subscription past its
//    current_period_end, a non-vaulted subscription that simply expired
//    with nobody manually re-paying, or a vaulted subscription that's
//    failed too many renewal attempts. This part is fully live today,
//    independent of Vault — it's what actually enforces "you stop being
//    Pro once you stop paying," which nothing did before this route.
const MAX_RENEWAL_ATTEMPTS = 3;
const RETRY_BACKOFF_DAYS = 2;

function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured yet, don't silently no-op forever — but
  // don't allow open unauthenticated access either. Vercel Cron sends
  // `Authorization: Bearer <CRON_SECRET>` automatically once CRON_SECRET
  // is set as a project env var; see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const now = new Date();
  const results = { renewalsAttempted: 0, renewalsFailed: 0, downgraded: 0, errors: [] as string[] };

  // --- 1. Renewal attempts (vaulted cards only) ---
  const { data: dueRenewals } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, currency, maya_customer_id, maya_card_token_id, failed_renewal_attempts")
    .eq("status", "active")
    .is("canceled_at", null)
    .not("maya_customer_id", "is", null)
    .not("maya_card_token_id", "is", null)
    .lte("next_billing_attempt_at", now.toISOString());

  for (const sub of dueRenewals ?? []) {
    results.renewalsAttempted++;
    const planDetails = getPlan(sub.currency as Currency, sub.plan as PlanSlug);
    if (!planDetails || !sub.maya_customer_id || !sub.maya_card_token_id) continue;

    const requestReferenceNumber = randomUUID();
    // Same record checkout uses, so the existing webhook's resolution
    // logic (request_reference_number -> user/plan) works unchanged for
    // renewal charges too, without any special-casing there.
    await supabase.from("checkout_sessions").insert({
      request_reference_number: requestReferenceNumber,
      user_id: sub.user_id,
      plan: sub.plan,
      currency: sub.currency,
    });

    try {
      await createCustomerPayment(sub.maya_customer_id, sub.maya_card_token_id, {
        amount: planDetails.amount,
        currency: sub.currency as Currency,
        description: `UpSkillNow ${planDetails.name} plan renewal (${sub.currency})`,
        requestReferenceNumber,
        redirectUrl: {
          // No customer is present for a headless renewal charge — these
          // only matter if Maya unexpectedly requires 3DS on this charge.
          success: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://upskillnow-live3.vercel.app"}/billing/success?ref=${requestReferenceNumber}&plan=${sub.plan}`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://upskillnow-live3.vercel.app"}/billing/cancel?ref=${requestReferenceNumber}&status=failed`,
          cancel: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://upskillnow-live3.vercel.app"}/billing/cancel?ref=${requestReferenceNumber}&status=cancelled`,
        },
      });
      // The actual success/failure state transition happens via the
      // webhook (async), same as a normal checkout — not here. Push
      // next_billing_attempt_at forward by the retry window as a safety
      // net so a slow/missing webhook doesn't cause duplicate charge
      // attempts on the next cron run; the webhook's PAYMENT_SUCCESS
      // handler overwrites this with the real period end once it lands.
      const fallback = new Date(now);
      fallback.setDate(fallback.getDate() + RETRY_BACKOFF_DAYS);
      await supabase
        .from("subscriptions")
        .update({ next_billing_attempt_at: fallback.toISOString() })
        .eq("id", sub.id);
    } catch (err: any) {
      results.renewalsFailed++;
      results.errors.push(`renewal ${sub.id}: ${err?.message ?? err}`);
      const attempts = (sub.failed_renewal_attempts ?? 0) + 1;
      const fallback = new Date(now);
      fallback.setDate(fallback.getDate() + RETRY_BACKOFF_DAYS);
      await supabase
        .from("subscriptions")
        .update({
          failed_renewal_attempts: attempts,
          status: attempts >= MAX_RENEWAL_ATTEMPTS ? "past_due" : "active",
          next_billing_attempt_at: fallback.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", sub.id);
    }
  }

  // --- 2. Downgrade sweep ---
  // Canceled subscriptions whose paid period has now actually ended.
  const { data: expiredCancellations } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "canceled")
    .lte("current_period_end", now.toISOString());

  // Subscriptions stuck past_due too many renewal attempts (Vault path).
  const { data: exhaustedRetries } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "past_due")
    .gte("failed_renewal_attempts", MAX_RENEWAL_ATTEMPTS);

  // Non-vaulted subscriptions (today's default: pay-again-manually) that
  // simply expired with nobody coming back to pay — no card on file to
  // even attempt a renewal against.
  const { data: lapsedManual } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .is("maya_card_token_id", null)
    .lte("current_period_end", now.toISOString());

  const toDowngrade = [
    ...(expiredCancellations ?? []),
    ...(exhaustedRetries ?? []),
    ...(lapsedManual ?? []),
  ];

  for (const sub of toDowngrade) {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", sub.user_id).maybeSingle();
    if (profile?.plan === "free") continue; // already downgraded, nothing to do

    await supabase.from("profiles").update({ plan: "free" }).eq("id", sub.user_id);
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("id", sub.id);

    await createNotification({
      userId: sub.user_id,
      type: "plan_downgraded",
      title: "You're back on the Free plan",
      body: "Your paid period ended and nothing renewed it, so your account is now on Free. Upgrade any time from Settings.",
      link: "/settings?tab=billing",
      relatedId: sub.id,
    });
    results.downgraded++;
  }

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), ...results });
}
