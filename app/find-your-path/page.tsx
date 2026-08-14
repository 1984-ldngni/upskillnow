"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLearningPaths, type LearningPath } from "@/lib/data";
import { Route, Sparkles } from "lucide-react";

// Trait-based scoring instead of "each answer picks one of 3 paths" — with
// 11 Learning Paths now live, a straight majority vote across 3 fixed
// options per question doesn't scale. Every quiz option instead nudges a
// small set of traits, and every path has a trait profile it scores
// against — so adding a 12th path later only means adding a trait profile,
// not rewriting every question.
type Trait =
  | "writing"
  | "automation"
  | "enterprise"
  | "creative"
  | "coding"
  | "healthcare"
  | "legal"
  | "productivity"
  // Its own signal (rather than sharing "writing") so Frontier AI Models
  // has a way to actually win — otherwise it never outscores the Executive
  // Assistant path, which also scores on writing plus productivity.
  | "modelFluency"
  // Same problem for Low-Code to Enterprise Automation: sharing "enterprise"
  // and "automation" meant it was always beaten by the paths that score
  // purely on one of those (Enterprise RPA Specialist, Automation
  // Specialist), since their weights are higher on their one strong trait.
  | "lowCodeOps";

type QuizOption = { label: string; traits: Partial<Record<Trait, number>> };
type QuizQuestion = { question: string; options: QuizOption[] };

const PATH_TRAITS: Record<string, Partial<Record<Trait, number>>> = {
  "ai-powered-executive-assistant": { writing: 2, productivity: 1 },
  "automation-specialist": { automation: 2 },
  "ai-creative-technical-toolkit": { creative: 1, coding: 1 },
  "enterprise-rpa-specialist": { enterprise: 2, automation: 1 },
  "low-code-to-enterprise-automation": { lowCodeOps: 3 },
  "ai-content-production": { creative: 2 },
  "ai-coding-support-specialist": { coding: 2 },
  "healthcare-patient-engagement": { healthcare: 2 },
  "legal-e-discovery-support": { legal: 2 },
  "executive-productivity-toolkit": { productivity: 2, writing: 1 },
  "frontier-ai-models": { modelFluency: 3 },
};

const QUESTIONS: QuizQuestion[] = [
  {
    question: "Which task would you rather spend your day on?",
    options: [
      { label: "Drafting emails, summarizing meetings, and research", traits: { writing: 2 } },
      { label: "Setting up workflows so tasks run without you", traits: { automation: 2 } },
      { label: "Creating graphics, video, or audio content", traits: { creative: 2 } },
      { label: "Supporting a dev team's code", traits: { coding: 2 } },
    ],
  },
  {
    question: "Which industry do you most want to specialize in?",
    options: [
      { label: "General / cross-industry", traits: { writing: 1, productivity: 1 } },
      { label: "Healthcare", traits: { healthcare: 2 } },
      { label: "Legal", traits: { legal: 2 } },
      { label: "Large enterprise / corporate ops", traits: { enterprise: 2 } },
    ],
  },
  {
    question: "How comfortable are you with technical, step-by-step tools?",
    options: [
      { label: "Not very — I prefer writing and communication", traits: { writing: 1, productivity: 1 } },
      { label: "Comfortable enough to follow a visual workflow builder", traits: { automation: 2 } },
      { label: "Very comfortable with structured enterprise software", traits: { enterprise: 2 } },
      { label: "Very comfortable with creative or coding tools", traits: { creative: 1, coding: 1 } },
    ],
  },
  {
    question: "Which tool sounds most appealing to learn next?",
    options: [
      { label: "ChatGPT", traits: { writing: 2 } },
      { label: "Claude or Gemini specifically", traits: { modelFluency: 2 } },
      { label: "Zapier, Make, or n8n", traits: { automation: 2 } },
      { label: "UiPath or Automation Anywhere", traits: { enterprise: 2 } },
      { label: "Midjourney, DALL-E, or ElevenLabs", traits: { creative: 2 } },
      { label: "Cursor or GitHub Copilot", traits: { coding: 2 } },
    ],
  },
  {
    question: "What's your longer-term goal as a VA?",
    options: [
      { label: "Be the go-to person for research, scheduling, and communication", traits: { writing: 1, productivity: 2 } },
      { label: "Build and offer automation systems as a service", traits: { automation: 2 } },
      { label: "Specialize in content or creative production", traits: { creative: 2 } },
      { label: "Support technical or dev-focused clients", traits: { coding: 2 } },
    ],
  },
  {
    question: "Which project would you enjoy most?",
    options: [
      { label: "Organizing an executive's inbox and prepping briefing docs", traits: { productivity: 2, writing: 1 } },
      { label: "Connecting apps so leads flow automatically into a CRM", traits: { automation: 2 } },
      { label: "Producing a batch of on-brand social media graphics or videos", traits: { creative: 2 } },
      { label: "Reviewing case documents for a legal team", traits: { legal: 2 } },
      { label: "Managing patient messaging and appointment reminders", traits: { healthcare: 2 } },
      { label: "Building an approval workflow so a team stops emailing PDFs back and forth", traits: { lowCodeOps: 2 } },
    ],
  },
  {
    question: "How would clients describe the value you bring?",
    options: [
      { label: "\"They keep my calendar and communications running smoothly\"", traits: { productivity: 2, writing: 1 } },
      { label: "\"They automate the boring repetitive stuff\"", traits: { automation: 2 } },
      { label: "\"They make things look and sound professional\"", traits: { creative: 2 } },
      { label: "\"They help our dev team move faster\"", traits: { coding: 2 } },
      { label: "\"They know their way around big enterprise software\"", traits: { enterprise: 2 } },
    ],
  },
];

export default function FindYourPathPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [paths, setPaths] = useState<LearningPath[]>([]);

  useEffect(() => {
    getLearningPaths().then(setPaths);
  }, []);

  const traitScores = useMemo(() => {
    const totals: Partial<Record<Trait, number>> = {};
    for (const [qi, optionIndex] of Object.entries(answers)) {
      const option = QUESTIONS[Number(qi)]?.options[optionIndex];
      if (!option) continue;
      for (const [trait, points] of Object.entries(option.traits)) {
        totals[trait as Trait] = (totals[trait as Trait] ?? 0) + (points ?? 0);
      }
    }
    return totals;
  }, [answers]);

  const recommendedSlug = useMemo(() => {
    let bestSlug: string | null = null;
    let bestScore = -Infinity;
    for (const [slug, weights] of Object.entries(PATH_TRAITS)) {
      let score = 0;
      for (const [trait, weight] of Object.entries(weights)) {
        score += (traitScores[trait as Trait] ?? 0) * (weight ?? 0);
      }
      if (score > bestScore) {
        bestScore = score;
        bestSlug = slug;
      }
    }
    return bestSlug;
  }, [traitScores]);

  const recommendedPath = paths.find((p) => p.slug === recommendedSlug) ?? null;
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <AppShell maxWidth="max-w-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h1 className="font-heading text-3xl font-black">Find your path</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Seven quick questions — we'll match you to one of our {paths.length || 11} Learning Paths.
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
                  {q.options.map((opt, oi) => (
                    <button
                      key={opt.label}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={`w-full rounded-md border-2 px-4 py-2 text-left text-sm font-medium transition-colors ${
                        answers[qi] === oi
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
                    <Route className="h-4 w-4 text-emerald-500" />
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
    </AppShell>
  );
}
