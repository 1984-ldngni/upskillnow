// Canned answers for the most common "Ask us" questions. Checked before ever
// calling the AI, so the bulk of real-world traffic (pricing, what's included,
// how the site works) costs nothing and answers instantly and consistently.
// Anything that doesn't match falls through to the AI in app/api/chat/route.ts.

export type FaqEntry = {
  id: string;
  triggers: string[];
  answer: string;
};

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "pricing",
    triggers: [
      "price",
      "pricing",
      "cost",
      "how much",
      "plan",
      "plans",
      "subscription",
      "fee",
      "₱",
      "php",
      "peso",
      "usd",
      "dollar",
    ],
    answer:
      "We have three plans: Free (₱0 / $0) — explore the tool directory and one starter course; Pro (₱495/mo or $9/mo) — full course library, quizzes, and AI Tutor access; and Team (₱1,495/mo or $24/mo) — everything in Pro for teams of 2–4, with your 4th seat free. Prices show automatically in PHP or USD based on your location, and you can toggle between them on the pricing section.",
  },
  {
    id: "tools-vs-courses",
    triggers: [
      "difference between tool",
      "tool directory",
      "vs course",
      "tools and courses",
      "what is the tool directory",
      "what's the tool directory",
    ],
    answer:
      "The Tool Directory is a browsable reference of AI and automation tools — no lessons attached, just descriptions and links. Courses are structured, multi-lesson tracks with quizzes that actually teach you how to use those tools step by step.",
  },
  {
    id: "learning-paths",
    triggers: ["learning path", "what is a path", "what are paths", "paths mean", "what's a path"],
    answer:
      "Learning Paths bundle several related courses into one themed track — for example, Automation Specialist or AI-Powered Executive Assistant — so you know exactly what to take next to build a specific skill set. Finish every course in a path and you earn a path certificate.",
  },
  {
    id: "certificates",
    triggers: ["certificate", "certification", "certified", "diploma"],
    answer:
      "You earn a course certificate once you've completed every free lesson in that course and passed its quiz (60% or higher). Finish every course inside a Learning Path and you'll also unlock a Learning Path certificate.",
  },
  {
    id: "get-started",
    triggers: ["sign up", "signup", "get started", "how do i start", "how do i begin", "create account", "register"],
    answer:
      "Click \"Get Started\" in the top right to create a free account — you'll get access to the tool directory and one starter course right away, no payment required.",
  },
];

// Only the latest user message is checked, so an earlier off-topic question
// doesn't keep matching after the conversation has moved on.
export function matchFaq(message: string): FaqEntry | null {
  const lower = message.toLowerCase();
  let best: { entry: FaqEntry; score: number } | null = null;

  for (const entry of FAQ_ENTRIES) {
    const score = entry.triggers.filter((t) => lower.includes(t)).length;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }

  return best?.entry ?? null;
}
