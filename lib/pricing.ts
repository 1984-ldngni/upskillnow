// Shared pricing data so the landing page's Pricing section and the
// Settings > Billing tab never drift out of sync with each other.

export type Currency = "USD" | "PHP";

// `slug` + `amount` are billing-facing (Maya Checkout needs a plain number,
// and the checkout API route needs a stable identifier that isn't tied to
// display copy) — kept alongside the existing display fields (`price`,
// `blurb`) rather than replacing them, so nothing that already renders a
// Plan needs to change.
export type PlanSlug = "free" | "pro" | "team";
export type Plan = { slug: PlanSlug; name: string; price: string; amount: number; blurb: string };

export const PLANS: Record<Currency, Plan[]> = {
  USD: [
    { slug: "free", name: "Free", price: "$0", amount: 0, blurb: "Explore the tool directory and one starter Skill Path." },
    { slug: "pro", name: "Pro", price: "$9/mo", amount: 9, blurb: "Full Skill Path library, quizzes, and AI Tutor access." },
    {
      slug: "team",
      name: "Team",
      price: "$24/mo",
      amount: 24,
      blurb: "Everything in Pro, for teams of 2–4 — your 4th seat is on us.",
    },
  ],
  PHP: [
    { slug: "free", name: "Free", price: "₱0", amount: 0, blurb: "Explore the tool directory and one starter Skill Path." },
    { slug: "pro", name: "Pro", price: "₱495/mo", amount: 495, blurb: "Full Skill Path library, quizzes, and AI Tutor access." },
    {
      slug: "team",
      name: "Team",
      price: "₱1,495/mo",
      amount: 1495,
      blurb: "Everything in Pro, for teams of 2–4 — your 4th seat is on us.",
    },
  ],
};

export function getPlan(currency: Currency, slug: PlanSlug): Plan | undefined {
  return PLANS[currency].find((p) => p.slug === slug);
}
