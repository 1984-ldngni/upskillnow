import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

// Shared so difficulty/pricing badges look the same everywhere they show up
// (tool directory, tool detail, courses) instead of drifting page to page.

export function difficultyVariant(level: string): BadgeVariant {
  switch (level) {
    case "Beginner":
      return "green";
    case "Intermediate":
      return "yellow";
    case "Advanced":
      return "orange";
    case "All Levels":
      return "purple";
    default:
      return "outline";
  }
}

export function pricingVariant(tier: string): BadgeVariant {
  switch (tier) {
    case "Free":
      return "green";
    case "Freemium":
      return "yellow";
    case "Paid":
      return "orange";
    case "Enterprise":
      return "purple";
    default:
      return "outline";
  }
}
