import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTools } from "@/lib/data";
import { difficultyVariant } from "@/lib/badge-colors";
import { Zap, Brain, Workflow, Mic } from "lucide-react";

export const dynamic = "force-dynamic";

const pricing = [
  { name: "Free", price: "$0", blurb: "Explore the tool directory and one starter course." },
  { name: "Pro", price: "$19/mo", blurb: "Full course library, quizzes, and AI Tutor access." },
  { name: "Team", price: "$49/mo", blurb: "Everything in Pro, plus seats and progress reporting." },
];

const features = [
  { icon: Brain, title: "AI Skill Assessment", desc: "Find your gaps and get a tailored learning roadmap." },
  { icon: Workflow, title: "Real Automation Blueprints", desc: "Step-by-step Zapier, Make, and n8n workflows." },
  { icon: Mic, title: "Audio Micro-Lessons", desc: "Learn on the go with 1–3 minute voice lessons." },
  { icon: Zap, title: "Live Tool Directory", desc: "150+ AI & automation tools, filtered by industry." },
];

export default async function LandingPage() {
  const tools = await getTools();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <Badge variant="accent" className="mb-4">For Virtual Assistants & Professionals</Badge>
          <h1 className="font-heading text-4xl font-black tracking-tight sm:text-6xl">
            Master the AI tools your clients already expect you to know
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            UpSkillNow curates and teaches the AI and automation tools professionals use across
            real estate, e-commerce, finance, marketing, and executive support — with hands-on
            courses, quizzes, and an AI tutor.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/auth"><Button size="lg">Start learning free</Button></Link>
            <Link href="/tools"><Button size="lg" variant="outline">Browse the tool directory</Button></Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2 text-base">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-2xl font-black">A few tools in the directory</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.slice(0, 6).map((t) => (
              <Card key={t.slug}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge variant={difficultyVariant(t.difficultyLevel)}>{t.difficultyLevel}</Badge>
                  </div>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{t.targetIndustry}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-heading text-2xl font-black">Simple pricing</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {pricing.map((p) => (
              <Card key={p.name}>
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <p className="font-heading text-3xl font-black">{p.price}</p>
                  <CardDescription>{p.blurb}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/auth"><Button className="w-full" variant={p.name === "Pro" ? "default" : "outline"}>Choose {p.name}</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-heading text-3xl font-black">Ready to upskill?</h2>
          <p className="mt-3 text-muted-foreground">Join now and get your personalized learning roadmap.</p>
          <Link href="/auth"><Button size="lg" className="mt-6">Get started free</Button></Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
