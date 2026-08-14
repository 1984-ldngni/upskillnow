import type { Metadata } from "next";
import "./globals.css";
import { ImpersonationProvider } from "@/lib/impersonation-context";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { GlobalErrorListener } from "@/components/global-error-listener";
import { ChatWidget } from "@/components/chat-widget";

// Runs before React hydrates so the dark class is already on <html> by the
// time the page paints — without this, a dark-mode user would see a flash
// of the light theme on every load.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("upskillnow-theme");
    var dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <ImpersonationProvider>
              <GlobalErrorListener />
              {children}
              <ChatWidget />
            </ImpersonationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
