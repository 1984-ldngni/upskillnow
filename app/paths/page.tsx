"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLearningPaths, type LearningPath } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";
import { Route } from "lucide-react";

export default function PathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLearningPaths().then((p) => {
      setPaths(p);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="font-heading text-3xl font-black">Learning Paths</h1>
        <p className="mt-2 text-muted-foreground">
          Themed tracks that bundle several courses toward one VA specialization.
        </p>

        {loading && <p className="mt-8 text-muted-foreground">Loading paths…</p>}

        {!loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => (
              <Card key={p.slug} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{p.title}</CardTitle>
                    </div>
                    <Badge variant={difficultyVariant(p.level)}>{p.level}</Badge>
                  </div>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {p.courses.map((c, i) => (
                      <li key={c.slug}>
                        {i + 1}. {c.title}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/paths/${p.slug}`}>
                    <Button size="sm" className="w-full">
                      View path ({p.courses.length} courses)
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {paths.length === 0 && (
              <p className="text-sm text-muted-foreground">No learning paths yet.</p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
