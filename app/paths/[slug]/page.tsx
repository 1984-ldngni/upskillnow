import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLearningPathBySlug } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";
import { BookOpen, Route } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearningPathPage({ params }: { params: { slug: string } }) {
  const path = await getLearningPathBySlug(params.slug);
  if (!path) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          <Badge variant={difficultyVariant(path.level)}>{path.level}</Badge>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-black">{path.title}</h1>
        <p className="mt-2 text-muted-foreground">{path.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{path.courses.length} courses in this path</p>

        <div className="mt-8 space-y-3">
          {path.courses.map((c, i) => (
            <Link key={c.slug} href={`/courses/${c.slug}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-black bg-secondary font-heading text-sm font-black">
                      {i + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">{c.title}</CardTitle>
                      </div>
                      <CardDescription className="mt-1">{c.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={difficultyVariant(c.level)}>{c.level}</Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/paths">
            <Button variant="outline">Back to all paths</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
