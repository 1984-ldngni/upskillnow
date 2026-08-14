"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, type Currency } from "@/lib/pricing";

export type { Currency };

export function PricingSection({ defaultCurrency }: { defaultCurrency: Currency }) {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <h2 className="font-heading text-2xl font-black">Simple pricing</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrency("USD")} aria-pressed={currency === "USD"}>
            <Badge variant={currency === "USD" ? "accent" : "outline"}>USD ($)</Badge>
          </button>
          <button onClick={() => setCurrency("PHP")} aria-pressed={currency === "PHP"}>
            <Badge variant={currency === "PHP" ? "accent" : "outline"}>PHP (₱)</Badge>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANS[currency].map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <p className="font-heading text-3xl font-black">{p.price}</p>
              <CardDescription>{p.blurb}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth">
                <Button className="w-full" variant={p.name === "Pro" ? "default" : "outline"}>
                  Choose {p.name}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
