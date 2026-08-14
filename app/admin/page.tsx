"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useImpersonation } from "@/lib/impersonation-context";
import { useAuth } from "@/lib/auth-context";
import {
  getAllProfiles,
  getCourseManagementList,
  type Profile,
  type CourseManagement,
} from "@/lib/data";
import { getRecentErrorLogs, type LoggedError } from "@/lib/error-logger";
import { difficultyVariant } from "@/lib/badge-colors";
import { Eye, AlertTriangle } from "lucide-react";

const levelVariant: Record<LoggedError["level"], "destructive" | "accent" | "outline"> = {
  error: "destructive",
  warning: "accent",
  info: "outline",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminPage() {
  const router = useRouter();
  const { loading: authLoading, userId, isAdmin } = useAuth();
  const { impersonatingUser, startImpersonation } = useImpersonation();
  const [users, setUsers] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<CourseManagement[]>([]);
  const [errorLogs, setErrorLogs] = useState<LoggedError[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push("/auth");
      return;
    }
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    Promise.all([getAllProfiles(), getCourseManagementList(), getRecentErrorLogs()]).then(
      ([u, c, logs]) => {
        setUsers(u);
        setCourses(c);
        setErrorLogs(logs);
        setDataLoading(false);
      }
    );
  }, [authLoading, userId, isAdmin, router]);

  if (authLoading || !userId || !isAdmin || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ImpersonationBanner />
      <div className="flex flex-1">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 p-6">
          {/* "Admin" + an "Admin only" badge, on a page already reachable
              only via the dark admin sidebar with its own "Admin mode"
              badge, said the same thing three times. Named for what the
              page actually does instead. */}
          <h1 className="font-heading text-2xl font-black">Console</h1>
          <p className="text-muted-foreground">
            Content management, user management, and troubleshooting tools — real Supabase data,
            not mock.
          </p>

          {/* Moved above the courses/users grid — errors are the thing an
              admin most needs to notice first, not something they should
              have to scroll past two other cards to find. */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-base">Recent errors ({errorLogs.length})</CardTitle>
                </div>
                <CardDescription>
                  Client-side errors, failed data fetches, and auth failures across every user —
                  captured automatically as they happen, no need to reproduce them yourself.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {errorLogs.map((log) => (
                  <div key={log.id} className="rounded-md border-2 border-black px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={levelVariant[log.level]}>{log.level}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.userEmail ?? "Not signed in"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
                    </div>
                    <p className="mt-1 font-medium">{log.message}</p>
                    {log.path && <p className="text-xs text-muted-foreground">on {log.path}</p>}
                  </div>
                ))}
                {errorLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No errors logged yet — that's a good sign.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All courses ({courses.length})</CardTitle>
                <CardDescription>
                  Every course in the catalog. There's no draft/published flag yet, so this list
                  is identical to what learners see — this is just the management view of it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {courses.map((c) => (
                  <div
                    key={c.slug}
                    className="flex items-center justify-between rounded-md border-2 border-black px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-bold">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.lessonCount} lessons · {c.quizCount} quiz questions
                      </p>
                    </div>
                    <Badge variant={difficultyVariant(c.level)}>{c.level}</Badge>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-sm text-muted-foreground">No courses yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">All users ({users.length})</CardTitle>
                <CardDescription>
                  Real signed-up accounts from Supabase. "View as" shows a read-only banner for
                  troubleshooting context — it does not yet start a real session as that user;
                  that requires a Supabase Edge Function, which is a separate, bigger build.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-md border-2 border-black px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-bold">{u.fullName || u.email || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.email} · {u.role}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={impersonatingUser?.id === u.id ? "secondary" : "outline"}
                      onClick={() =>
                        startImpersonation({ id: u.id, name: u.fullName || u.email || "User" })
                      }
                    >
                      <Eye className="mr-1 h-3.5 w-3.5 text-sky-500" />
                      View as
                    </Button>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          </main>
        </div>
      </div>
    </div>
  );
}
