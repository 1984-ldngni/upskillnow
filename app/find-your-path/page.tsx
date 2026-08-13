"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLearningPaths, type LearningPath } from "@/lib/data";
import { Route, Sparkles } from "lucide-react";

type PathSlug = "ai-powered-executive-assistant" | "automation-specialist" | "ai-creative-technical-toolkit";

type QuizOption = { label: string; path: PathSlug };
type QuizQuestion = { question: string; options: QuizOption[] };

const QUESTIONS: QuizQuestion[] = [
  {
    question: "Which task would you rather spend your day on?",
    options: [
      { label: "Drafting emails, summarizing meetings, and research", path: "ai-powered-executive-assistant" },
      { label: "Setting up workflows so tasks run without you", path: "automation-specialist" },
      { label: "Creating graphics or working inside a code editor", path: "ai-creative-technical-toolkit" },
    ],
  },
  {
    question: "A client wants to save time on a repetitive task. What's your first move?",
    options: [
      { label: "Write them a clear, AI-drafted process doc", path: "ai-powered-executive-assistant" },
      { label: "Build a Zapier or n8n workflow that does it automatically", path: "automation-specialist" },
      { label: "Generate the visual assets or script it yourself", path: "ai-creative-technical-toolkit" },
    ],
  },
  {
    question: "Which tool sounds most appealing to learn next?",
    options: [
      { label: "ChatGPT or NotebookLM", path: "ai-powered-executive-assistant" },
      { label: "Zapier or n8n", path: "automation-specialist" },
      { label: "Midjourney or Cursor", path: "ai-creative-technical-toolkit" },
    ],
  },
];

export default function FindYourPathPage() {
  const [answers, setAnswers] = useState<Record<number, PathSlug>>({});
  const [submitted, setSubmitted] = useState(false);
  const [paths, setPaths] = useState<LearningPath[]>([]);

  useEffect(() => {
    getLearningPaths().then(setPaths);
  }, []);

  const recommendedSlug = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slug of Object.values(answers)) counts[slug] = (counts[slug] ?? 0) + 1;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return (entries[0]?.[0] as PathSlug | undefined) ?? null;
  }, [answers]);

  const recommendedPath = paths.find((p) => p.slug === recommendedSlug) ?? null;
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-3xl font-black">Find your path</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Three quick questions — we'll recommend a Learning Path to start with.
        </p>

        {!submitted && (
          <div className="mt-8 space-y-6">
            {QUESTIONS.map((q, qi) => (
              <Card key={q.question}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {qi + 1}. {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: opt.path }))}
                      className={`w-full rounded-md border-2 px-4 py-2 text-left text-sm font-medium transition-colors ${
                        answers[qi] === opt.path
                          ? "border-black bg-primary/10"
                          : "border-black hover:bg-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button disabled={!allAnswered} onClick={() => setSubmitted(true)}>
              See my recommendation
            </Button>
          </div>
        )}

        {submitted && (
          <div className="mt-8">
            {recommendedPath ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-primary" />
                    <CardTitle>{recommendedPath.title}</CardTitle>
                  </div>
                  <CardDescription>{recommendedPath.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Link href={`/paths/${recommendedPath.slug}`}>
                    <Button>View this path</Button>
                  </Link>
                  <Button variant="outline" onClick={reset}>
                    Retake the quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground">Loading your recommendation…</p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
