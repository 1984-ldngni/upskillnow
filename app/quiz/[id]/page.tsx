"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCourseBySlug,
  getQuizForCourseSlug,
  saveQuizAttempt,
  type Course,
  type QuizQuestion,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { Award } from "lucide-react";

const PASSING_RATIO = 0.6;

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading, userId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push(`/auth?next=/quiz/${params.id}`);
      return;
    }
    Promise.all([getCourseBySlug(params.id), getQuizForCourseSlug(params.id)]).then(([c, q]) => {
      setCourse(c);
      setQuestions(q);
      setLoading(false);
    });
  }, [authLoading, userId, params.id, router]);

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
    0
  );
  const passed = questions.length > 0 && score / questions.length >= PASSING_RATIO;

  async function handleSubmit() {
    setSubmitted(true);
    if (course) {
      await saveQuizAttempt(course.id, score, questions.length);
      setSaved(true);
    }
  }

  if (authLoading || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="font-heading text-3xl font-black">Quiz</h1>

        {loading && <p className="mt-4 text-muted-foreground">Loading quiz…</p>}

        {!loading && questions.length === 0 && (
          <p className="mt-4 text-muted-foreground">No quiz found for this course yet.</p>
        )}

        {!submitted &&
          questions.map((q, i) => (
            <Card key={q.question} className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {i + 1}. {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`w-full rounded-md border-2 px-4 py-2 text-left text-sm font-medium transition-colors ${
                      answers[i] === oi
                        ? "border-black bg-primary/10"
                        : "border-black hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}

        {!submitted && questions.length > 0 && (
          <Button className="mt-6" onClick={handleSubmit}>
            Submit answers
          </Button>
        )}

        {submitted && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                You scored {score} / {questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              {passed ? (
                <p className="text-sm font-medium text-emerald-600">
                  You passed! {saved ? "" : "Saving your result…"}
                </p>
              ) : (
                <p className="text-sm font-medium text-destructive">
                  Not quite — you need {Math.ceil(questions.length * PASSING_RATIO)}/{questions.length} to
                  pass. Feel free to retake it.
                </p>
              )}
              {course && (
                <Link href={`/courses/${course.slug}`}>
                  <Button size="sm" variant="outline">Back to course</Button>
                </Link>
              )}
              {course && passed && (
                <Link href={`/certificate/${course.slug}`}>
                  <Button size="sm">
                    <Award className="mr-2 h-4 w-4" />
                    Check your certificate
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
