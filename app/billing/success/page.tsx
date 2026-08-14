"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, Loader2 } from "lucide-react";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 6;

// Maya redirects here right after the customer pays, but that redirect
// alone doesn't confirm the payment — the actual plan activation happens
// server-side when Maya's webhook lands (app/api/billing/webhook/route.ts),
// which can arrive a beat after this page loads. So this page polls the
// user's own profile for a few seconds waiting for `plan` to update, rather
// than claiming success the instant the browser lands here.
export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BillingSuccessInner />
    </Suspense>
  );
}

function BillingSuccessInner() {
  const searchParams = useSearchParams();
  const expectedPlan = searchParams.get("plan");
  const { profile, refreshProfile } = useAuth();
  const [pollCount, setPollCount] = useState(0);

  const confirmed = expectedPlan ? profile?.plan === expectedPlan : false;

  useEffect(() => {
    if (confirmed || pollCount >= MAX_POLLS) return;
    const timer = setTimeout(async () => {
      await refreshProfile();
      setPollCount((n) => n + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [confirmed, pollCount, refreshProfile]);

  const timedOut = !confirmed && pollCount >= MAX_POLLS;

  return (
    <AppShell maxWidth="max-w-lg">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {confirmed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            <CardTitle>
              {confirmed
                ? "You're all set!"
                : timedOut
                  ? "Still confirming your payment"
                  : "Confirming your payment…"}
            </CardTitle>
          </div>
          <CardDescription>
            {confirmed
              ? "Your plan has been upgraded. Thanks for subscribing to UpSkillNow."
              : timedOut
                ? "This is taking longer than usual. Your payment may still be processing — check back in a few minutes, or reach out if your plan hasn't updated."
                : "We're finalizing your subscription with Maya. This usually takes just a few seconds."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/settings">
            <Button variant={confirmed || timedOut ? "default" : "outline"}>Go to Billing settings</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
