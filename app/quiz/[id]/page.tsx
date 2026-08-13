"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQuizForCourseSlug, type QuizQuestion } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading, userId } = useAuth();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push(`/auth?next=/quiz/${params.id}`);
      return;
    }
    getQuizForCourseSlug(params.id)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [authLoading, userId, params.id, router]);

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
    0
  );

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
          <Button className="mt-6" onClick={() => setSubmitted(true)}>
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
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
