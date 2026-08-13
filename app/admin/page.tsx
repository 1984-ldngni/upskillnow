"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
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
import { Eye } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { loading: authLoading, userId, isAdmin } = useAuth();
  const { impersonatingUser, startImpersonation } = useImpersonation();
  const [users, setUsers] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<CourseManagement[]>([]);
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
    Promise.all([getAllProfiles(), getCourseManagementList()]).then(([u, c]) => {
      setUsers(u);
      setCourses(c);
      setDataLoading(false);
    });
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
        <main className="flex-1 p-6">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black">Admin</h1>
            <Badge variant="accent">Admin only</Badge>
          </div>
          <p className="text-muted-foreground">
            Content management, user management, and troubleshooting tools — real Supabase data,
            not mock.
          </p>

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
                    <Badge variant="outline">{c.level}</Badge>
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
                      <Eye className="mr-1 h-3.5 w-3.5" />
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
  );
}
