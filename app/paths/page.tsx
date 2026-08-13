"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLearningPaths, type LearningPath } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";
import { Route, Sparkles } from "lucide-react";

const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "All Levels"];

export default function PathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  useEffect(() => {
    getLearningPaths().then((p) => {
      setPaths(p);
      setLoading(false);
    });
  }, []);

  const levels = useMemo(() => {
    const present = Array.from(new Set(paths.map((p) => p.level)));
    return present.sort((a, b) => {
      const ai = LEVEL_ORDER.indexOf(a);
      const bi = LEVEL_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [paths]);

  const visiblePaths = activeLevel ? paths.filter((p) => p.level === activeLevel) : paths;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-black">Learning Paths</h1>
            <p className="mt-2 text-muted-foreground">
              Themed tracks that bundle several courses toward one VA specialization.
            </p>
          </div>
          <Link href="/find-your-path">
            <Button variant="outline" size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Not sure? Take the 1-minute quiz
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveLevel(null)}>
            <Badge variant={activeLevel === null ? "accent" : "outline"}>All ({paths.length})</Badge>
          </button>
          {levels.map((lvl) => {
            const count = paths.filter((p) => p.level === lvl).length;
            return (
              <button key={lvl} onClick={() => setActiveLevel(lvl)}>
                <Badge variant={activeLevel === lvl ? "accent" : difficultyVariant(lvl)}>
                  {lvl} ({count})
                </Badge>
              </button>
            );
          })}
        </div>

        {loading && <p className="mt-8 text-muted-foreground">Loading paths…</p>}

        {!loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePaths.map((p) => (
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
            {visiblePaths.length === 0 && (
              <p className="text-sm text-muted-foreground">No paths at this level yet.</p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
