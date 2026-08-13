"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourses, type Course } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";

// Fixed order so filters don't jump around as more levels get added.
const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "All Levels"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  useEffect(() => {
    getCourses().then((c) => {
      setCourses(c);
      setLoading(false);
    });
  }, []);

  const levels = useMemo(() => {
    const present = Array.from(new Set(courses.map((c) => c.level)));
    return present.sort((a, b) => {
      const ai = LEVEL_ORDER.indexOf(a);
      const bi = LEVEL_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [courses]);

  const visibleCourses = activeLevel ? courses.filter((c) => c.level === activeLevel) : courses;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black">Courses</h1>
            <p className="mt-2 text-muted-foreground">Modular, step-by-step tracks by skill level.</p>
          </div>
          <Link href="/paths">
            <Button variant="outline" size="sm">Browse Learning Paths</Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveLevel(null)}>
            <Badge variant={activeLevel === null ? "accent" : "outline"}>
              All ({courses.length})
            </Badge>
          </button>
          {levels.map((lvl) => {
            const count = courses.filter((c) => c.level === lvl).length;
            return (
              <button key={lvl} onClick={() => setActiveLevel(lvl)}>
                <Badge variant={activeLevel === lvl ? "accent" : difficultyVariant(lvl)}>
                  {lvl} ({count})
                </Badge>
              </button>
            );
          })}
        </div>

        {loading && <p className="mt-8 text-muted-foreground">Loading courses…</p>}

        {!loading && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleCourses.map((c) => (
              <Card key={c.slug}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{c.title}</CardTitle>
                    <Badge variant={difficultyVariant(c.level)}>{c.level}</Badge>
                  </div>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/courses/${c.slug}`}>
                    <Button size="sm" className="mt-3">View course</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {visibleCourses.length === 0 && (
              <p className="text-sm text-muted-foreground">No courses at this level yet.</p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
