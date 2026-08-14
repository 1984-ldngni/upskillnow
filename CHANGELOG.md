# Changelog

All notable changes to UpSkillNow are logged here, most recent first.

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
