"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCourseBySlug,
  getLessonsForCourseSlug,
  getQuizForCourseSlug,
  getCompletedLessonIds,
  setLessonComplete,
  getBestQuizAttempt,
  isQuizPassed,
  type Course,
  type Lesson,
  type QuizQuestion,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { PlayCircle, Lock, CheckCircle2, Award } from "lucide-react";

export default function CourseLessonPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { loading: authLoading, userId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [quizPassed, setQuizPassed] = useState(false);
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
      Promise.all([
        getLessonsForCourseSlug(params.slug),
        getQuizForCourseSlug(params.slug),
        getCompletedLessonIds(),
        getBestQuizAttempt(c.id),
      ]).then(([l, q, completed, attempt]) => {
        setLessons(l);
        setQuiz(q);
        setCompletedIds(completed);
        setQuizPassed(isQuizPassed(attempt));
        setDataLoading(false);
      });
    });
  }, [authLoading, userId, params.slug, router]);

  async function toggleComplete(lessonId: string, currentlyComplete: boolean) {
    // Optimistic update so the checkmark responds instantly.
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (currentlyComplete) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
    await setLessonComplete(lessonId, !currentlyComplete);
  }

  if (authLoading || !userId || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <AppShell maxWidth="max-w-3xl">
          <p className="text-muted-foreground">Course not found.</p>
      </AppShell>
    );
  }

  const hasQuiz = quiz.length > 0;
  const freeLessons = lessons.filter((l) => !l.isPremium);
  const completedFreeCount = freeLessons.filter((l) => completedIds.has(l.id)).length;
  const allFreeLessonsDone = freeLessons.length > 0 && completedFreeCount === freeLessons.length;
  const certificateEarned = allFreeLessonsDone && quizPassed;
  const progressPct = freeLessons.length > 0 ? Math.round((completedFreeCount / freeLessons.length) * 100) : 0;

  return (
    <AppShell maxWidth="max-w-3xl">
        <div className="mt-4 flex items-center gap-2">
          <h1 className="font-heading text-3xl font-black">{course.title}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{course.description}</p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{completedFreeCount} / {freeLessons.length} free lessons complete</span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full border-2 border-black bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {lessons.map((lesson, i) => {
            const complete = completedIds.has(lesson.id);
            return (
              <Card key={lesson.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                  <div className="flex items-center gap-3">
                    {lesson.isPremium ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : complete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
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
                    <Button
                      size="sm"
                      variant={complete ? "secondary" : "outline"}
                      onClick={() => toggleComplete(lesson.id, complete)}
                    >
                      {complete ? "Completed" : "Mark complete"}
                    </Button>
                  )}
                </CardHeader>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free lessons cover the essentials. Pro lessons go deeper — unlock them with a Pro or Team plan.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {hasQuiz && (
            <Link href={`/quiz/${course.slug}`}>
              <Button>{quizPassed ? "Retake the quiz" : "Take the quiz"}</Button>
            </Link>
          )}
          {certificateEarned ? (
            <Link href={`/certificate/${course.slug}`}>
              <Button variant="outline">
                <Award className="mr-2 h-4 w-4 text-amber-500" />
                View your certificate
              </Button>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">
              Complete all free lessons and pass the quiz to earn a certificate.
            </p>
          )}
        </div>
    </AppShell>
  );
}
