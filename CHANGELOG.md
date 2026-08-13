# Changelog

All notable changes to UpSkillNow are logged here, most recent first.

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

---

## Earlier history (pre-changelog)

Not logged in detail here — see git commit history for the full record. Highlights:
Next.js/Supabase/Vercel scaffold, neo-brutalist redesign, 31-tool directory, real
Supabase auth + role-based admin panel with error logging, PHP/USD pricing toggle,
5 pilot tool-courses (ChatGPT, Cursor, Midjourney, NotebookLM, n8n) with free/Pro
lesson split, course-tool cross-linking, sign-in gating on course/quiz content,
keyboard-key logo redesign.
