"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourses, getCourseDurationsMinutes, type Course } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";

// Fixed order so filters don't jump around as more levels get added.
const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "All Levels"];

type DurationBucket = "Under 15 min" | "15–30 min" | "30+ min";

function bucketFor(minutes: number): DurationBucket {
  if (minutes < 15) return "Under 15 min";
  if (minutes <= 30) return "15–30 min";
  return "30+ min";
}

const DURATION_ORDER: DurationBucket[] = ["Under 15 min", "15–30 min", "30+ min"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeDuration, setActiveDuration] = useState<DurationBucket | null>(null);

  useEffect(() => {
    getCourses().then((c) => {
      setCourses(c);
      getCourseDurationsMinutes(c.map((course) => course.id)).then((d) => {
        setDurations(d);
        setLoading(false);
      });
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

  const bucketOf = (c: Course) => bucketFor(durations[c.id] ?? 0);

  const visibleCourses = courses.filter((c) => {
    if (activeLevel && c.level !== activeLevel) return false;
    if (activeDuration && bucketOf(c) !== activeDuration) return false;
    return true;
  });

  return (
    <AppShell>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black">Courses</h1>
            <p className="mt-2 text-muted-foreground">Modular, step-by-step tracks by skill level.</p>
          </div>
          <Link href="/paths">
            <Button variant="outline" size="sm">Browse Learning Paths</Button>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Level</span>
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

          {!loading && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Time to complete</span>
              <button onClick={() => setActiveDuration(null)}>
                <Badge variant={activeDuration === null ? "accent" : "outline"}>All</Badge>
              </button>
              {DURATION_ORDER.filter((b) => courses.some((c) => bucketOf(c) === b)).map((b) => (
                <button key={b} onClick={() => setActiveDuration(b)}>
                  <Badge variant={activeDuration === b ? "accent" : "outline"}>{b}</Badge>
                </button>
              ))}
            </div>
          )}
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
                  <p className="text-xs text-muted-foreground">~{durations[c.id] ?? 0} min total</p>
                </CardHeader>
                <CardContent>
                  <Link href={`/courses/${c.slug}`}>
                    <Button size="sm" className="mt-3">View course</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {visibleCourses.length === 0 && (
              <p className="text-sm text-muted-foreground">No courses match these filters yet.</p>
            )}
          </div>
        )}
    </AppShell>
  );
}
