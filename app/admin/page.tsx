"use client";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/lib/impersonation-context";
import { mockUsers } from "@/lib/mock-data";
import { Eye } from "lucide-react";

export default function AdminPage() {
  const { impersonatingUser, startImpersonation } = useImpersonation();

  return (
    <div className="flex min-h-screen flex-col">
      <ImpersonationBanner />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <h1 className="font-heading text-2xl font-black">Admin</h1>
          <p className="text-muted-foreground">
            Content management, user management, and troubleshooting tools.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content management</CardTitle>
                <CardDescription>
                  Manage tool directory entries, courses, and quiz banks. (Connects to Supabase
                  `tools`, `courses`, `tool_skills` tables.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">Open content editor</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">User management</CardTitle>
                <CardDescription>
                  View as user for troubleshooting. Impersonation is read-only and scoped via a
                  Supabase Edge Function that validates the admin role before issuing a temporary
                  token.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.plan}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={impersonatingUser?.id === u.id ? "secondary" : "outline"}
                      onClick={() => startImpersonation({ id: u.id, name: u.name })}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View as
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
