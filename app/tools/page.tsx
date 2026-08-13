"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTools, type Tool } from "@/lib/data";
import { difficultyVariant, pricingVariant } from "@/lib/badge-colors";

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    getTools().then((t) => {
      setTools(t);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(tools.map((t) => t.category))).sort(),
    [tools]
  );

  const visibleTools = activeCategory ? tools.filter((t) => t.category === activeCategory) : tools;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="font-heading text-3xl font-black">AI & Automation Tool Directory</h1>
        <p className="mt-2 text-muted-foreground">
          Browse tools by category, industry, and difficulty level.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory(null)}>
            <Badge variant={activeCategory === null ? "accent" : "outline"}>
              All ({tools.length})
            </Badge>
          </button>
          {categories.map((c) => {
            const count = tools.filter((t) => t.category === c).length;
            return (
              <button key={c} onClick={() => setActiveCategory(c)}>
                <Badge variant={activeCategory === c ? "accent" : "outline"}>
                  {c} ({count})
                </Badge>
              </button>
            );
          })}
        </div>

        {loading && <p className="mt-8 text-muted-foreground">Loading tools…</p>}

        {!loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <Badge variant={difficultyVariant(t.difficultyLevel)}>{t.difficultyLevel}</Badge>
                    </div>
                    <CardDescription>{t.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{t.targetIndustry}</Badge>
                    <Badge variant={pricingVariant(t.pricingTier)}>{t.pricingTier}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {visibleTools.length === 0 && (
              <p className="text-sm text-muted-foreground">No tools in this category yet.</p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
