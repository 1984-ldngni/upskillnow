# Changelog

All notable changes to UpSkillNow are logged here, most recent first.

## 2026-08-14 — Find Your Path quiz now covers all 11 Learning Paths
- The quiz was hardcoded to 3 fixed path slugs, with each answer picking
  one directly and a majority vote deciding the result — that approach
  doesn't scale to 11 paths.
- Rewrote it as trait-based scoring instead: 7 questions, each option
  nudges a small set of traits (writing, automation, enterprise, creative,
  coding, healthcare, legal, productivity, plus two dedicated signals —
  see below), and each of the 11 paths has its own trait profile it's
  matched against. Adding a 12th path later just means adding a trait
  profile, not rewriting every question.
- Verified all 11 paths are actually reachable as the top result by
  simulating answer patterns for each. Two needed a dedicated signal
  because sharing traits with a "purer" path meant they could never win on
  points alone: Frontier AI Models (shared "writing" with the Executive
  Assistant path, which also scores on productivity) and Low-Code to
  Enterprise Automation (shared "enterprise"/"automation" with the two
  paths that score purely on one of those at a higher weight). Both got
  their own trait plus a clearly-scoped quiz option so they're each
  reachable when a learner's answers actually point that way.

## 2026-08-14 — 8 new Learning Paths cover the 26 previously-orphaned courses (data only, no code changes)
- Reviewed the 26 tool courses that weren't in any Learning Path and found
  clean thematic groupings. Added 8 new paths:
  - **Enterprise RPA Specialist** — UiPath → Automation Anywhere → Blue Prism
  - **Low-Code to Enterprise Automation** — Power Automate → Kissflow → Pega → WorkFusion
  - **AI Content Production** — DALL-E → Synthesia → ElevenLabs
  - **AI Coding Support Specialist** — GitHub Copilot → Windsurf → Claude Code
  - **Healthcare Patient Engagement** — Tidio → Drift → Klara → Luma Health
  - **Legal E-Discovery Support** — Everlaw → Relativity
  - **Executive Productivity Toolkit** — Motion → Slack → Microsoft Copilot 365
  - **Frontier AI Models: Claude & Gemini** — Claude → Gemini
- Also restructured the existing **Automation Specialist** path from one
  combined intro course + n8n into a real beginner-to-advanced progression:
  Zapier → Make → n8n. The old combined "Workflow Automation with Zapier &
  Make" course is still live and browsable on its own, just no longer
  required for this path's certificate.
- Result: 32 of 33 courses now belong to at least one of 11 total Learning
  Paths (up from 7 of 33 across 3 paths). The one remaining standalone
  course is the now-superseded combined Zapier & Make course, intentionally
  left out since its content is superseded by the new progression.
- No app code changed — `/paths`, `/paths/[slug]`, and the dashboard's
  Learning Path recommendation all read live from Supabase, so this shows
  up automatically. Not yet updated: the Find Your Path quiz still only
  recommends 3 of the now-11 paths — worth expanding separately.

## 2026-08-14 — Dashboard recommends a specialization, not a random tool
- "Recommended tools for you" was just `tools.slice(0, 3)` — the first three
  tools alphabetically, identical for every learner regardless of what
  they'd actually done. Replaced with a real recommendation tied to
  Learning Paths ("specializations"):
  - New `getRecommendedPath()` in `lib/data.ts` scores each Learning Path by
    how many of its courses you've completed vs. merely started, and picks
    the one you're closest to finishing (falling back to one you've
    started at all).
  - **In progress on a path** → "Continue your [Path] path — next up:
    [course]" with a Continue button straight into that course.
  - **Nothing started** → "Not sure where to start?" pointing at the
    Find Your Path quiz.
  - **Started courses, but none are part of a path** → different copy
    ("Focus your learning with a specialization") instead of falsely
    claiming you haven't started anything.
  - **Every path finished** → congratulates you and points at the full
    course library instead of repeating a path you've already done.
- Known gap worth addressing next: only 7 of the 33 courses currently
  belong to a Learning Path (across all 3 paths) — the 26 newer tool
  courses aren't in any path yet, so this recommendation has nothing to
  point most learners toward until that's expanded.

## 2026-08-14 — Colored icons app-wide
- Most icons across the app were plain black/gray/muted, even ones meant to
  help with quick visual scanning (sidebar nav, Settings tabs, admin
  actions). Gave semantic accent colors to icons that stand alone or lead a
  label, app-wide:
  - Sidebar nav: Overview (indigo), Tool Directory (orange), Courses (pink),
    Paths (emerald), Admin Overview (violet), Preview as Learner (sky).
  - Settings tabs: Profile (indigo), Notifications (amber), Theme (pink),
    Billing (emerald); theme picker icons (Sun/Moon/Monitor) each got their
    own color too.
  - Sign out and account-menu icons: red for sign out, indigo for Profile
    settings.
  - Certificate/award icons (course cards, dashboard, quiz) — amber/gold.
    Admin "View as" — sky. Landing page's 4 feature icons — violet, orange,
    emerald, amber instead of all-indigo.
  - Left icons that are already colored via their container alone (white
    icons on solid indigo buttons, the pink impersonation banner, the amber
    chat bubble) or that intentionally signal a locked/disabled state
    (grayed-out Lock icon, "not earned yet" certificate icons) unchanged —
    recoloring those would have hurt contrast or the state they're meant to
    convey.

## 2026-08-14 — "Continue learning" only shows courses you've actually started
- The dashboard's "Continue learning" section listed every course in the
  catalog (33 of them), not just ones with any progress — effectively a
  duplicate of the full course list.
- Now filters to courses with `completedFreeLessons > 0`. If none have been
  started yet, shows an empty state ("You haven't started a course yet")
  with a "Browse courses" button instead of an empty or overstuffed grid.

## 2026-08-14 — Removed redundant "Overview" from admin nav
- Admin sidebar showed both "Admin Overview" (`/admin`) and "Overview"
  (`/dashboard`) at the same time — two overview-style links back to back.
  Dropped the learner "Overview" link for admins; "Admin Overview" is their
  landing page, and "Preview as Learner" (already in the sidebar) still gets
  them to the real learner dashboard when they want it.

## 2026-08-14 — Billing tab shows plans inline instead of linking out
- The Billing tab's "View plans & upgrade" button sent signed-in users to
  `/#pricing` on the public landing page — jarring, and not what "billing"
  should feel like from inside the app.
- Extracted the plan data (Free/Pro/Team, USD + PHP) out of
  `pricing-section.tsx` into a shared `lib/pricing.ts` so the landing page
  and Settings can't drift out of sync with each other.
- Billing tab now renders the plan cards directly, with the same USD/PHP
  toggle as the landing page, a "Current: Free" badge, and "Choose Pro/Team"
  buttons — no navigation. Since there's still no real Stripe integration,
  choosing a paid plan shows an honest inline note ("isn't wired up to real
  billing yet") rather than pretending to charge anything.

## 2026-08-14 — Settings page: folder tabs instead of one long scroll
- New `components/ui/tabs.tsx` — a small hand-rolled tabs primitive (no Radix
  dependency) styled like manila-folder tabs: the active tab sits flush
  against the panel below with no shared border seam, inactive tabs sit a
  couple pixels lower and behind it.
- `/settings` now organizes Profile, Notifications, Theme, and Billing into
  four tabs sharing one bordered panel instead of stacking four separate
  cards down the page. Sign out lives at the bottom of the Profile tab.

## 2026-08-14 — Fixed profiles RLS recursion; Settings gets notifications, dark mode, billing
- **Root-cause fix**: the "Admins read all profiles" RLS policy queried the
  `profiles` table from inside its own `USING` clause, which Postgres flags
  as infinite recursion (`42P17`) — this was silently breaking essentially
  every profile read app-wide (client code caught the error and just fell
  back to a null profile), which explains the blank email field on Settings,
  the default "A" avatar, and admin status intermittently not sticking.
  Replaced it with a `SECURITY DEFINER` `is_admin()` helper function, which
  bypasses RLS internally and breaks the recursive cycle. Verified by
  simulating an authenticated request against the old vs. new policy.
- `auth-context.tsx` now surfaces profile-fetch errors via `logClientError`
  (visible in the admin error log) instead of swallowing them silently, so
  this class of bug won't disappear without a trace again.
- **Notifications**: new `notify_email` / `notify_in_app` columns on
  `profiles`. Settings has toggles for both (auto-saving), plus an SMS
  toggle shown disabled with "Coming soon, once UpSkillNow is a native app."
- **Theme**: real Light/Dark/System support, not just a stub. New
  `ThemeProvider` (`lib/theme-context.tsx`) resolves the theme, listens for
  OS changes while on "System," and persists the choice to `localStorage`
  per device. A blocking inline script in `app/layout.tsx` applies the dark
  class before first paint so there's no flash. `app/globals.css` gained a
  `.dark` CSS-variable palette; since the neo-brutalist look uses hardcoded
  `border-black` rather than the `border` token, added a `.dark .border-black`
  repaint rule, and the offset "brutal" shadows (`tailwind.config.ts`) now
  read `hsl(var(--border))` instead of a hardcoded `#000` so they follow suit
  instead of vanishing against a dark background. The Admin sidebar's dark
  styling was switched to fixed `zinc-900`/`zinc-50` colors (was using the
  theme-reactive foreground/background tokens) so "Admin mode" still reads
  as a distinct dark surface even when the site's own dark theme is on.
- **Billing**: read-only card showing the current plan (Free) with a "View
  plans & upgrade" link to `/#pricing`. No payment processing yet — there's
  no Stripe integration in the app; this is intentionally just a status +
  upsell link for now.

## 2026-08-14 — Admin sidebar now persists across every page
- The dark "Admin mode" sidebar theme and admin nav links were keyed off the
  URL (`pathname.startsWith("/admin")`), so an admin looked like a regular
  learner the moment they left `/admin` — e.g. on `/dashboard`, `/tools`,
  `/courses`, `/paths`. Confusing, since nothing about their account had
  changed.
- `DashboardSidebar` now bases the admin look on the account's actual role
  (`isAdmin` from `useAuth()`), not the current route, so it's consistently
  dark with the "Admin mode" badge everywhere. The nav now also always
  includes both "Admin Overview" and the learner links (Overview, Tool
  Directory, Courses, Paths), so admins can navigate anywhere without losing
  their admin chrome.
- The one exception: `/dashboard?preview=1` ("Preview as Learner") still
  switches to the real light learner sidebar, via a new `previewingAsLearner`
  prop passed only from that page — every other page doesn't touch this and
  defaults to the admin's real role.

## 2026-08-14 — Profile menu + settings page, yellow "Ask us" bubble
- Sign out was buried at the bottom of the left sidebar. Replaced it with a
  new `AppTopbar` (top-right account button, avatar-style initial) shown
  above the main content on every signed-in page — `/dashboard`, `/admin`,
  and all 7 `AppShell` catalog pages. Clicking it opens a dropdown with the
  user's name/email, a "Profile settings" link, and "Sign out."
- `DashboardSidebar` no longer renders a sign-out button at all.
- New `/settings` page: edit your display name (saved to `profiles.full_name`,
  which is what shows up on certificates), view your email (read-only for
  now), and a secondary sign-out option. `useAuth()` gained `refreshProfile()`
  so the topbar/sidebar reflect a name change immediately after saving.
- "Ask us" chat bubble and its panel header changed from the primary blue to
  amber/yellow (`bg-amber-300`) — with blue used everywhere else in the app,
  the bubble was blending in instead of standing out.

## 2026-08-14 — Unified logged-in navigation (AppShell)
- Signed-in users were still seeing the public marketing header (`SiteHeader`)
  on `/tools`, `/tools/[slug]`, `/courses`, `/courses/[slug]`, `/paths`,
  `/paths/[slug]`, and `/find-your-path` — only `/dashboard` and `/admin` used
  the app sidebar, so navigating between pages felt like bouncing between two
  different apps.
- New `components/app-shell.tsx`: a shared shell that shows the `DashboardSidebar`
  (same one used on `/dashboard`/`/admin`) for signed-in users, and falls back to
  the marketing `SiteHeader`/`SiteFooter` for signed-out visitors — so the
  catalog is still fully browsable pre-signup, but the whole logged-in
  experience now shares one consistent shell.
- Converted all 7 pages above to use `AppShell` in place of their own
  `SiteHeader`/`SiteFooter` wrapper.

### Follow-up: distinct admin UI + "Preview as Learner"
- `DashboardSidebar` now shows different nav links depending on whether you're
  in `/admin` (Admin Overview only) or the learner app (Overview, Tool
  Directory, Courses, Paths — Paths was missing before), with a dark theme and
  an "Admin mode" badge while in the admin area.
- Admins visiting `/dashboard` are auto-redirected to `/admin` as before, but
  can now click "Preview as Learner" to see the real learner dashboard using
  their own account's real data (via `?preview=1`, which bypasses the
  redirect) — no need to create a second test account.

## 2026-08-14 — Codecademy-inspired feature build (in progress)

Reviewed Codecademy's catalog/course/path structure to borrow proven UX patterns —
not their course content, since UpSkillNow serves a different audience (VAs learning
AI & automation tools) with its own course library. Building in three phases:

1. **Learning Paths** — bundle existing courses into themed tracks (e.g. "Automation
   Specialist"), mirroring Codecademy's Skill Path / Career Path concept.
2. **Progress tracking + certificates** — per-lesson completion, "continue where you
   left off," and a certificate on course completion.
3. **Catalog filters + recommendation quiz** — time-to-complete filter, path-vs-course
   filter, and a short quiz recommending a path.

### Phase 1: Learning Paths
- Added `learning_paths` and `learning_path_courses` tables (Supabase migration).
- Seeded 3 paths bundling the existing 7 courses:
  - **Automation Specialist** — Workflow Automation with Zapier & Make, n8n
  - **AI-Powered Executive Assistant** — AI Fundamentals, ChatGPT, NotebookLM
  - **AI Creative & Technical Toolkit** — Midjourney, Cursor
- New `/paths` (listing) and `/paths/[slug]` (detail) pages.
- Added "Paths" to the main nav.

### Phase 2: Progress tracking + certificates
- Added `lesson_completions` and `quiz_attempts` tables (Supabase migration), both
  RLS-scoped so users only ever see/write their own rows.
- Course page: free lessons can be marked complete (checkmark + progress bar);
  premium lessons stay locked behind the Pro upsell as before.
- Quiz page: attempts are saved with score; passing is 60%+.
- New `/certificate/[slug]` page — unlocks once all free lessons are complete AND
  the quiz is passed, shows a printable certificate with the learner's name.
- Dashboard "Continue learning" cards now show real per-course progress bars, a
  "Certified" badge, and a link to the certificate once earned.

### Phase 3: Catalog filters + recommendation quiz
- `/courses` now has a second filter row: "Time to complete" (Under 15 min /
  15–30 min / 30+ min), computed by summing lesson durations per course.
- `/paths` got the same level filter treatment as `/courses`, plus a link to the
  new recommendation quiz.
- New `/find-your-path` — a 3-question quiz that recommends one of the 3 Learning
  Paths based on the learner's answers (no DB storage, pure client-side scoring).

### Follow-up: Learning Path certificates
- A path is "complete" once every course inside it meets the existing course
  completion bar (all free lessons + passing quiz).
- `/paths/[slug]` now shows per-course checkmarks, an overall progress bar, and
  a "View your path certificate" button once every course is done (signed-in
  users only — browsing a path's contents still doesn't require an account).
- New `/certificate/path/[slug]` — a path-level certificate listing every course
  completed, separate from the existing per-course certificate.

## 2026-08-14 — "Ask us" AI chat widget
- Floating chat bubble (`components/chat-widget.tsx`) added to every page via
  `app/layout.tsx`.
- New `POST /api/chat` route: calls the Anthropic API (`claude-haiku-4-5`),
  grounded each request in a live snapshot of the tools/courses/paths catalog
  pulled from Supabase, so answers stay accurate as the catalog grows.
- Requires an `ANTHROPIC_API_KEY` environment variable in Vercel — without it,
  the widget still works but replies with a "not fully set up yet" message
  instead of erroring.

### Follow-up: canned answers before AI (cost control)
- Added `lib/chat-faq.ts` — keyword-matched canned answers for the questions
  most people actually ask (pricing, tools vs. courses, learning paths,
  certificates, how to sign up).
- `/api/chat` now checks the latest message against these first and returns
  instantly with no AI call and no cost if it matches. Only messages that
  don't match anything canned reach the AI, which keeps the bot feeling
  responsive rather than robotic while cutting expected cost dramatically.

## 2026-08-14 — Full course library (data only, no code changes)
- Added a dedicated course for every remaining tool in the directory — 26 new
  courses (`claude-for-vas`, `gemini-for-vas`, `dalle-for-vas`,
  `synthesia-for-vas`, `slack-for-vas`, `automation-anywhere-for-vas`,
  `blue-prism-for-vas`, `power-automate-for-vas`, `pega-platform-for-vas`,
  `uipath-for-vas`, `workfusion-for-vas`, `motion-for-vas`, `drift-for-vas`,
  `klara-for-vas`, `luma-health-for-vas`, `tidio-for-vas`, `everlaw-for-vas`,
  `relativity-for-vas`, `microsoft-copilot-365-for-vas`,
  `claude-code-for-vas`, `github-copilot-for-vas`, `windsurf-for-vas`,
  `elevenlabs-for-vas`, `kissflow-for-vas`, `make-for-vas`, `zapier-for-vas`),
  each with 3 free + 3 Pro lessons and a 5-question quiz, same structure as
  the original pilot batch.
- Every one of the 31 tools in the directory now links to a matching course
  (verified via `tools` LEFT JOIN `courses` — zero unmatched tools).
- Total course count: 33 (2 general + 5 pilot batch + 26 new). No app code
  changed — the tool↔course cross-linking and Learning Paths already read
  live from Supabase, so this content shows up automatically.

---

## Earlier history (pre-changelog)

Not logged in detail here — see git commit history for the full record. Highlights:
Next.js/Supabase/Vercel scaffold, neo-brutalist redesign, 31-tool directory, real
Supabase auth + role-based admin panel with error logging, PHP/USD pricing toggle,
5 pilot tool-courses (ChatGPT, Cursor, Midjourney, NotebookLM, n8n) with free/Pro
lesson split, course-tool cross-linking, sign-in gating on course/quiz content,
keyboard-key logo redesign.
