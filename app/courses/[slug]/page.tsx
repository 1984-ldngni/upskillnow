"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCourseBySlug,
  getLessonsForCourseSlug,
  getQuizForCourseSlug,
  type Course,
  type Lesson,
  type QuizQuestion,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { PlayCircle, Lock } from "lucide-react";

export default function CourseLessonPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { loading: authLoading, userId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push(`/auth?next=/courses/${params.slug}`);
      return;
    }
    getCourseBySlug(params.slug).then((c) => {
      if (!c) {
        setNotFound(true);
        setDataLoading(false);
        return;
      }
      setCourse(c);
      Promise.all([getLessonsForCourseSlug(params.slug), getQuizForCourseSlug(params.slug)]).then(
        ([l, q]) => {
          setLessons(l);
          setQuiz(q);
          setDataLoading(false);
        }
      );
    });
  }, [authLoading, userId, params.slug, router]);

  if (authLoading || !userId || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (notFound || !course) {
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

  const hasQuiz = quiz.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="mt-4 flex items-center gap-2">
          <h1 className="font-heading text-3xl font-black">{course.title}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{course.description}</p>

        <div className="mt-8 space-y-3">
          {lessons.map((lesson, i) => (
            <Card key={lesson.title}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                <div className="flex items-center gap-3">
                  {lesson.isPremium ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Lesson {i + 1}: {lesson.title}</CardTitle>
                      {lesson.isPremium && <Badge variant="purple">Pro</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{lesson.duration} audio micro-lesson</p>
                  </div>
                </div>
                {lesson.isPremium ? (
                  <Link href="/#pricing">
                    <Button size="sm" variant="outline">Upgrade</Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="outline">Play</Button>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free lessons cover the essentials. Pro lessons go deeper — unlock them with a Pro or Team plan.
        </p>

        {hasQuiz && (
          <div className="mt-8">
            <Link href={`/quiz/${course.slug}`}>
              <Button>Take the quiz</Button>
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
