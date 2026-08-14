import { NextResponse } from "next/server";
import { getUserFromAccessToken, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Called from Settings -> Billing when a paying user clicks "Cancel plan".
//
// No Maya API call happens here on purpose: the current checkout flow uses
// Maya's one-time Checkout endpoint per billing period (see app/api/
// billing/checkout/route.ts), not a live Maya-side recurring subscription —
// there is nothing on Maya's end that auto-charges next cycle, so there's
// nothing to cancel there. Renewal today is "pay again next period," not
// silent auto-renewal; genuine auto-renewal would need Maya Vault
// (save-card-and-charge-later) wired up separately, which isn't built yet.
//
// This route just marks intent: the subscription is flagged canceled so it
// stops being offered as "renew," while `profiles.plan` is deliberately
// left alone here so the user keeps access through what they already paid
// for. Nothing currently reverts `profiles.plan` to free once
// current_period_end passes — that enforcement (a scheduled job) hasn't
// been built yet either, flagged separately.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await getUserFromAccessToken(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Cancel: failed to fetch subscription:", fetchError);
      return NextResponse.json({ error: "Couldn't cancel. Please try again." }, { status: 500 });
    }
    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
    }
    if (subscription.status === "canceled") {
      return NextResponse.json({ ok: true, alreadyCanceled: true });
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Cancel: failed to update subscription:", updateError);
      return NextResponse.json({ error: "Couldn't cancel. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Billing cancel error:", err);
    return NextResponse.json({ error: "Couldn't cancel. Please try again." }, { status: 500 });
  }
}
