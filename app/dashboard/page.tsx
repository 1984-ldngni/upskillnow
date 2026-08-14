"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AppTopbar } from "@/components/app-topbar";
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
import { Award, ShieldCheck, BookOpen, Route, Sparkles, PartyPopper } from "lucide-react";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const { loading: authLoading, userId, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendedPath | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push("/auth");
      return;
    }
    // Admins land here from a fresh sign-in too (via the "next" fallback), so
    // only skip the redirect to /admin when they deliberately clicked
    // "Preview as Learner" (which sets ?preview=1).
    if (isAdmin && !isPreview) {
      router.push("/admin");
      return;
    }
    Promise.all([getCoursesWithProgress(), getTools(), getRecommendedPath()]).then(([c, t, r]) => {
      setCourses(c);
      setTools(t);
      setRecommendation(r);
      setDataLoading(false);
    });
  }, [authLoading, userId, isAdmin, isPreview, router]);

  if (authLoading || !userId || (isAdmin && !isPreview) || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar previewingAsLearner={isPreview} />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 p-6">
        {isAdmin && (
          <div className="mb-4 flex items-center justify-between rounded-md border-2 border-black bg-secondary px-4 py-3 text-sm">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
              You're previewing the learner dashboard as an admin.
            </div>
            <Link href="/admin">
              <Button size="sm" variant="outline">Back to Admin</Button>
            </Link>
          </div>
        )}

        <h1 className="font-heading text-2xl font-black">Welcome back</h1>
        <p className="text-muted-foreground">Here's where you left off.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Courses available</CardDescription>
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
                      <p className="font-bold">You haven't started a course yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Once you mark a lesson complete, it'll show up here so you can pick up where you left off.
                      </p>
                    </div>
                    <Link href="/courses">
                      <Button size="sm">Browse courses</Button>
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
            <Link href="/paths" className="text-sm font-medium text-primary">Browse paths</Link>
          </div>
          <div className="mt-4">
            {recommendation?.status === "in-progress" && recommendation.path && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-base">Continue your {recommendation.path.title} path</CardTitle>
                  </div>
                  <CardDescription>
                    {recommendation.completedCount} / {recommendation.totalCount} courses complete
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
                    Nicely done — every Learning Path is finished. Explore the tool directory or full
                    course library for what's next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link href="/courses">
                    <Button size="sm" variant="outline">Browse all courses</Button>
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
                      ? "You've been taking individual courses — a Learning Path bundles a few into a themed specialization with its own certificate."
                      : "Take our 2-minute quiz and we'll recommend a Learning Path to start with."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link href="/find-your-path">
                    <Button size="sm">Take the quiz</Button>
                  </Link>
                  <Link href="/paths">
                    <Button size="sm" variant="outline">Browse paths</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
