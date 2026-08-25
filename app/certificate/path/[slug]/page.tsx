"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getLearningPathProgress, type LearningPathProgress } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";
import { Award, Route } from "lucide-react";

export default function PathCertificatePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { loading: authLoading, userId, profile } = useAuth();

  const [progress, setProgress] = useState<LearningPathProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push(`/auth?next=/certificate/path/${params.slug}`);
      return;
    }
    getLearningPathProgress(params.slug).then((p) => {
      setProgress(p);
      setLoading(false);
    });
  }, [authLoading, userId, params.slug, router]);

  if (authLoading || !userId || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
          <p className="text-muted-foreground">Path not found.</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { path, pathCompleted, latestCompletionDate, completionByCourseSlug } = progress;

  if (!pathCompleted) {
    const remaining = path.courses.filter((c) => !completionByCourseSlug.get(c.slug)?.completed);
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-center">
          <Route className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-black">Not earned yet</h1>
          <p className="mt-2 text-muted-foreground">
            Finish every Skill Path in {path.title} to unlock this career path certificate. You still have{" "}
            {remaining.length} Skill Path{remaining.length === 1 ? "" : "s"} to go:
          </p>
          <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-muted-foreground">
            {remaining.map((c) => (
              <li key={c.slug}>
                •{" "}
                <Link href={`/courses/${c.slug}`} className="font-medium text-primary hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`/paths/${path.slug}`}>
            <Button className="mt-6">Back to path</Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const dateEarned = latestCompletionDate
    ? new Date(latestCompletionDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-screen flex-col">
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full rounded-md border-4 border-black bg-card p-10 text-center shadow-brutal">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Career Path Certificate
          </p>
          <p className="mt-6 text-sm text-muted-foreground">This certifies that</p>
          <h1 className="mt-2 font-heading text-3xl font-black">
            {profile?.fullName || profile?.email || "UpSkillNow Learner"}
          </h1>
          <p className="mt-6 text-sm text-muted-foreground">has successfully completed the</p>
          <h2 className="mt-2 font-heading text-2xl font-black text-primary">{path.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {path.courses.length} Skill Path{path.courses.length === 1 ? "" : "s"}: {path.courses.map((c) => c.title).join(", ")}
          </p>
          <p className="mt-8 text-xs text-muted-foreground">Awarded {dateEarned}</p>
        </div>

        <div className="mt-6 flex gap-3 print:hidden">
          <Button onClick={() => window.print()}>
            <Award className="mr-2 h-4 w-4" />
            Print / Save as PDF
          </Button>
          <Link href={`/paths/${path.slug}`}>
            <Button variant="outline">Back to path</Button>
          </Link>
        </div>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
