import type { Metadata } from "next";
import "./globals.css";
import { ImpersonationProvider } from "@/lib/impersonation-context";
import { AuthProvider } from "@/lib/auth-context";

// Note: using system font stacks (see tailwind.config.ts) instead of next/font/google
// so builds don't depend on fetching fonts.googleapis.com at build time. Swap in
// next/font/google (Inter/Sora) once this deploys somewhere with reliable build-time
// network access, or self-host the font files instead.

export const metadata: Metadata = {
  title: "UpSkillNow — AI & Automation Skills for Virtual Assistants",
  description:
    "Learn the AI and automation tools professionals actually use, organized by industry and skill level.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ImpersonationProvider>{children}</ImpersonationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
