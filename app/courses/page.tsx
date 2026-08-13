import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getCourses();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="font-heading text-3xl font-black">Courses</h1>
        <p className="mt-2 text-muted-foreground">Modular, step-by-step tracks by skill level.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((c) => (
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
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
