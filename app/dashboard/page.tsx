import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCourses, getTools } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [courses, tools] = await Promise.all([getCourses(), getTools()]);

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
            {courses.map((c) => (
              <Card key={c.slug}>
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/courses/${c.slug}`}>
                    <Button size="sm">Resume</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
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
