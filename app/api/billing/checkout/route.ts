import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createCheckout } from "@/lib/maya";
import { getUserFromAccessToken, getServiceRoleClient } from "@/lib/supabase/server";
import { getPlan, type Currency, type PlanSlug } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Called from Settings -> Billing when the user clicks "Choose Pro"/"Choose
// Team". Creates a Maya Checkout session for that plan and returns the
// hosted checkout URL to redirect the browser to. The webhook route (not
// this one) is what actually activates the plan once payment succeeds.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    // Verified server-side against Supabase itself, not just trusted from
    // the request body — otherwise anyone could POST an arbitrary user id.
    const user = await getUserFromAccessToken(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as PlanSlug;
    const currency = body?.currency as Currency;

    if (plan !== "pro" && plan !== "team") {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    if (currency !== "PHP" && currency !== "USD") {
      return NextResponse.json({ error: "Invalid currency." }, { status: 400 });
    }

    const planDetails = getPlan(currency, plan);
    if (!planDetails) {
      return NextResponse.json({ error: "Plan not found." }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    // Unique per attempt (not per user+plan) so retrying a failed/abandoned
    // checkout doesn't collide with the previous requestReferenceNumber.
    const requestReferenceNumber = randomUUID();

    // Record the pending attempt before calling Maya, so the webhook route
    // can resolve requestReferenceNumber -> user/plan even if Maya doesn't
    // echo back the metadata we send below (unconfirmed without live
    // testing against the real API).
    const supabase = getServiceRoleClient();
    const { error: sessionError } = await supabase.from("checkout_sessions").insert({
      request_reference_number: requestReferenceNumber,
      user_id: user.id,
      plan,
      currency,
    });
    if (sessionError) {
      console.error("Failed to record checkout session:", sessionError);
      return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
    }

    const checkout = await createCheckout({
      amount: planDetails.amount,
      currency,
      description: `UpSkillNow ${planDetails.name} plan (${currency})`,
      requestReferenceNumber,
      redirectUrl: {
        success: `${origin}/billing/success?ref=${requestReferenceNumber}&plan=${plan}`,
        failure: `${origin}/billing/cancel?ref=${requestReferenceNumber}&status=failed`,
        cancel: `${origin}/billing/cancel?ref=${requestReferenceNumber}&status=cancelled`,
      },
      // Carried through to the webhook payload so it can be matched back to
      // this user and plan without relying solely on requestReferenceNumber.
      metadata: {
        userId: user.id,
        plan,
        currency,
      },
    });

    return NextResponse.json({ redirectUrl: checkout.redirectUrl });
  } catch (err: any) {
    console.error("Billing checkout error:", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }
}
