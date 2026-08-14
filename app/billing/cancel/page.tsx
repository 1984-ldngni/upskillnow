"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <Suspense fallback={null}>
      <BillingCancelInner />
    </Suspense>
  );
}

function BillingCancelInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const failed = status === "failed";

  return (
    <AppShell maxWidth="max-w-lg">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{failed ? "Payment didn't go through" : "Checkout cancelled"}</CardTitle>
          </div>
          <CardDescription>
            {failed
              ? "Your payment couldn't be processed — no charge was made. Double-check your card or GCash details and try again."
              : "No charge was made. You can pick a plan again any time from Billing settings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/settings">
            <Button>Back to Billing settings</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
