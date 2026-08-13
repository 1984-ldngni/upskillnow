import { ArrowUp } from "lucide-react";

const sizes = {
  sm: { box: "h-6 w-6", icon: "h-3 w-3", text: "text-sm" },
  md: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-lg" },
  lg: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-2xl" },
} as const;

export function Logo({ size = "md" }: { size?: keyof typeof sizes }) {
  const s = sizes[size];
  return (
    <span className="flex items-center gap-2 font-heading font-extrabold">
      {/* Keycap: the "Up" in UpSkillNow, styled like a physical keyboard key. */}
      <span
        className={`flex ${s.box} shrink-0 items-center justify-center rounded-md border-2 border-black bg-primary shadow-brutal-sm`}
      >
        <ArrowUp className={`${s.icon} text-primary-foreground`} strokeWidth={3} />
      </span>
      <span className={s.text}>SkillNow</span>
    </span>
  );
}
