"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLearningPathBySlug,
  getLearningPathProgress,
  type LearningPath,
  type CourseCompletion,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { difficultyVariant } from "@/lib/badge-colors";
import { Award, BookOpen, CheckCircle2, Route } from "lucide-react";

export default function LearningPathPage() {
  const params = useParams<{ slug: string }>();
  const { loading: authLoading, userId } = useAuth();

  const [path, setPath] = useState<LearningPath | null>(null);
  const [completion, setCompletion] = useState<Map<string, CourseCompletion>>(new Map());
  const [pathCompleted, setPathCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      // Browsing a path's contents doesn't require sign-in — only progress
      // tracking and the certificate do.
      getLearningPathBySlug(params.slug).then((p) => {
        setPath(p);
        setLoading(false);
      });
      return;
    }

    getLearningPathProgress(params.slug).then((progress) => {
      if (progress) {
        setPath(progress.path);
        setCompletion(progress.completionByCourseSlug);
        setPathCompleted(progress.pathCompleted);
      }
      setLoading(false);
    });
  }, [authLoading, userId, params.slug]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!path) {
    return (
      <AppShell maxWidth="max-w-3xl">
          <p className="text-muted-foreground">Path not found.</p>
      </AppShell>
    );
  }

  const completedCount = path.courses.filter((c) => completion.get(c.slug)?.completed).length;

  return (
    <AppShell maxWidth="max-w-3xl">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          <Badge variant={difficultyVariant(path.level)}>{path.level}</Badge>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-black">{path.title}</h1>
        <p className="mt-2 text-muted-foreground">{path.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {userId ? `${completedCount} / ${path.courses.length} courses complete` : `${path.courses.length} courses in this path`}
        </p>

        {userId && path.courses.length > 0 && (
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full border-2 border-black bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.round((completedCount / path.courses.length) * 100)}%` }}
            />
          </div>
        )}

        <div className="mt-8 space-y-3">
          {path.courses.map((c, i) => {
            const done = completion.get(c.slug)?.completed;
            return (
              <Link key={c.slug} href={`/courses/${c.slug}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-black bg-secondary font-heading text-sm font-black">
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-primary" />
                          )}
                          <CardTitle className="text-sm">{c.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">{c.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={difficultyVariant(c.level)}>{c.level}</Badge>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/paths">
            <Button variant="outline">Back to all paths</Button>
          </Link>
          {userId && (
            pathCompleted ? (
              <Link href={`/certificate/path/${path.slug}`}>
                <Button>
                  <Award className="mr-2 h-4 w-4" />
                  View your path certificate
                </Button>
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">
                Complete every course in this path to earn a path certificate.
              </p>
            )
          )}
        </div>
    </AppShell>
  );
}
