// Shared pricing data so the landing page's Pricing section and the
// Settings > Billing tab never drift out of sync with each other.

export type Currency = "USD" | "PHP";

export type Plan = { name: string; price: string; blurb: string };

export const PLANS: Record<Currency, Plan[]> = {
  USD: [
    { name: "Free", price: "$0", blurb: "Explore the tool directory and one starter course." },
    { name: "Pro", price: "$9/mo", blurb: "Full course library, quizzes, and AI Tutor access." },
    {
      name: "Team",
      price: "$24/mo",
      blurb: "Everything in Pro, for teams of 2–4 — your 4th seat is on us.",
    },
  ],
  PHP: [
    { name: "Free", price: "₱0", blurb: "Explore the tool directory and one starter course." },
    { name: "Pro", price: "₱495/mo", blurb: "Full course library, quizzes, and AI Tutor access." },
    {
      name: "Team",
      price: "₱1,495/mo",
      blurb: "Everything in Pro, for teams of 2–4 — your 4th seat is on us.",
    },
  ],
};
