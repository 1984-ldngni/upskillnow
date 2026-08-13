"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  getCourseBySlug,
  getLessonsForCourseSlug,
  getCompletedLessonIds,
  getBestQuizAttempt,
  isQuizPassed,
  type Course,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";
import { Award } from "lucide-react";

export default function CertificatePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { loading: authLoading, userId, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [eligible, setEligible] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push(`/auth?next=/certificate/${params.slug}`);
      return;
    }
    getCourseBySlug(params.slug).then((c) => {
      if (!c) {
        setLoading(false);
        return;
      }
      setCourse(c);
      Promise.all([
        getLessonsForCourseSlug(params.slug),
        getCompletedLessonIds(),
        getBestQuizAttempt(c.id),
      ]).then(([lessons, completedIds, attempt]) => {
        const freeLessons = lessons.filter((l) => !l.isPremium);
        const allDone = freeLessons.length > 0 && freeLessons.every((l) => completedIds.has(l.id));
        const passed = isQuizPassed(attempt);
        setEligible(allDone && passed);
        setCompletedAt(attempt?.completedAt ?? null);
        setLoading(false);
      });
    });
  }, [authLoading, userId, params.slug, router]);

  if (authLoading || !userId || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
          <p className="text-muted-foreground">Course not found.</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-black">Not earned yet</h1>
          <p className="mt-2 text-muted-foreground">
            Complete every free lesson and pass the quiz for {course.title} to unlock your certificate.
          </p>
          <Link href={`/courses/${course.slug}`}>
            <Button className="mt-6">Back to course</Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const dateEarned = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
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
            Certificate of Completion
          </p>
          <p className="mt-6 text-sm text-muted-foreground">This certifies that</p>
          <h1 className="mt-2 font-heading text-3xl font-black">
            {profile?.fullName || profile?.email || "UpSkillNow Learner"}
          </h1>
          <p className="mt-6 text-sm text-muted-foreground">has successfully completed</p>
          <h2 className="mt-2 font-heading text-2xl font-black text-primary">{course.title}</h2>
          <p className="mt-8 text-xs text-muted-foreground">Awarded {dateEarned}</p>
        </div>

        <div className="mt-6 flex gap-3 print:hidden">
          <Button onClick={() => window.print()}>Print / Save as PDF</Button>
          <Link href={`/courses/${course.slug}`}>
            <Button variant="outline">Back to course</Button>
          </Link>
        </div>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
