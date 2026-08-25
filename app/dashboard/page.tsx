"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { PreviewModeBanner } from "@/components/preview-mode-banner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCoursesWithProgress,
  getTools,
  getRecommendedPath,
  type CourseProgress,
  type Tool,
  type RecommendedPath,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { usePreviewMode } from "@/lib/preview-mode-context";
import { Award, BookOpen, Route, Sparkles, PartyPopper } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { loading: authLoading, userId, isAdmin } = useAuth();
  // Session-wide state (not a ?preview=1 query param) — only flips when the
  // admin explicitly clicks "Preview as Learner" or "Back to Admin," and
  // stays put across navigation to /tools, /courses, /paths, etc. `loading`
  // covers the brief window before the sessionStorage read on mount
  // completes, so a hard reload while previewing doesn't briefly look like
  // "not previewing" and bounce the admin to /admin.
  const { previewingAsLearner, loading: previewLoading } = usePreviewMode();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendedPath | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || previewLoading) return;
    if (!userId) {
      router.push("/auth");
      return;
    }
    // Admins land here from a fresh sign-in too (via the "next" fallback), so
    // only skip the redirect to /admin when they deliberately clicked
    // "Preview as Learner."
    if (isAdmin && !previewingAsLearner) {
      router.push("/admin");
      return;
    }
    Promise.all([getCoursesWithProgress(), getTools(), getRecommendedPath()]).then(([c, t, r]) => {
      setCourses(c);
      setTools(t);
      setRecommendation(r);
      setDataLoading(false);
    });
  }, [authLoading, previewLoading, userId, isAdmin, previewingAsLearner, router]);

  if (authLoading || previewLoading || !userId || (isAdmin && !previewingAsLearner) || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PreviewModeBanner />
      <div className="flex flex-1">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 p-6">
        <h1 className="font-heading text-2xl font-black">Welcome back</h1>
        <p className="text-muted-foreground">Here's where you left off.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Skill Paths available</CardDescription>
              <CardTitle className="text-3xl">{courses.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Tools in directory</CardDescription>
              <CardTitle className="text-3xl">{tools.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Skill assessment score</CardDescription>
              <CardTitle className="text-3xl">—</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Continue learning</h2>
            <Link href="/courses" className="text-sm font-medium text-primary">View all</Link>
          </div>
          {(() => {
            const started = courses.filter((c) => c.completedFreeLessons > 0);
            if (started.length === 0) {
              return (
                <Card className="mt-4">
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-bold">You haven't started a Skill Path yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Once you mark a lesson complete, it'll show up here so you can pick up where you left off.
                      </p>
                    </div>
                    <Link href="/courses">
                      <Button size="sm">Browse Skill Paths</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {started.map((c) => {
                  const pct = c.totalFreeLessons > 0
                    ? Math.round((c.completedFreeLessons / c.totalFreeLessons) * 100)
                    : 0;
                  return (
                    <Card key={c.slug}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{c.title}</CardTitle>
                          {c.certificateEarned && <Badge variant="green">Certified</Badge>}
                        </div>
                        <CardDescription>{c.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{c.completedFreeLessons} / {c.totalFreeLessons} lessons</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full border-2 border-black bg-secondary">
                            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/courses/${c.slug}`}>
                            <Button size="sm">Resume</Button>
                          </Link>
                          {c.certificateEarned && (
                            <Link href={`/certificate/${c.slug}`}>
                              <Button size="sm" variant="outline">
                                <Award className="mr-1 h-3.5 w-3.5 text-amber-500" />
                                Certificate
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recommended for you</h2>
            <Link href="/paths" className="text-sm font-medium text-primary">Browse Career Paths</Link>
          </div>
          <div className="mt-4">
            {recommendation?.status === "in-progress" && recommendation.path && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-base">Continue your {recommendation.path.title} career path</CardTitle>
                  </div>
                  <CardDescription>
                    {recommendation.completedCount} / {recommendation.totalCount} Skill Paths complete
                    {recommendation.nextCourse && ` — next up: ${recommendation.nextCourse.title}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {recommendation.nextCourse && (
                    <Link href={`/courses/${recommendation.nextCourse.slug}`}>
                      <Button size="sm">Continue</Button>
                    </Link>
                  )}
                  <Link href={`/paths/${recommendation.path.slug}`}>
                    <Button size="sm" variant="outline">View path</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {recommendation?.status === "all-completed" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">You've completed every specialization</CardTitle>
                  </div>
                  <CardDescription>
                    Nicely done — every Career Path is finished. Explore the tool directory or full
                    Skill Path library for what's next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link href="/courses">
                    <Button size="sm" variant="outline">Browse all Skill Paths</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {recommendation?.status === "no-path-progress" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <CardTitle className="text-base">
                      {recommendation.hasAnyCourseProgress
                        ? "Focus your learning with a specialization"
                        : "Not sure where to start?"}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {recommendation.hasAnyCourseProgress
                      ? "You've been taking individual Skill Paths — a Career Path bundles a few into a themed specialization with its own certificate."
                      : "Take our 2-minute quiz and we'll recommend a Career Path to start with."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link href="/find-your-path">
                    <Button size="sm">Take the quiz</Button>
                  </Link>
                  <Link href="/paths">
                    <Button size="sm" variant="outline">Browse Career Paths</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}
