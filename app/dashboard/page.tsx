"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCoursesWithProgress, getTools, type CourseProgress, type Tool } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { Award } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { loading: authLoading, userId, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push("/auth");
      return;
    }
    if (isAdmin) {
      router.push("/admin");
      return;
    }
    Promise.all([getCoursesWithProgress(), getTools()]).then(([c, t]) => {
      setCourses(c);
      setTools(t);
      setDataLoading(false);
    });
  }, [authLoading, userId, isAdmin, router]);

  if (authLoading || !userId || isAdmin || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-6">
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
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.map((c) => {
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
                        <Button size="sm">{pct > 0 ? "Resume" : "Start"}</Button>
                      </Link>
                      {c.certificateEarned && (
                        <Link href={`/certificate/${c.slug}`}>
                          <Button size="sm" variant="outline">
                            <Award className="mr-1 h-3.5 w-3.5" />
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
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recommended tools for you</h2>
            <Link href="/tools" className="text-sm font-medium text-primary">Browse directory</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tools.slice(0, 3).map((t) => (
              <Card key={t.slug}>
                <CardHeader>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
