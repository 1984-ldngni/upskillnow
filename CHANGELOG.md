# Changelog

All notable changes to UpSkillNow are logged here, most recent first.

## 2026-08-25 — Infographic font sizes fixed directly in Canva (no regeneration)
- Lessons 2, 3, 4, and 6's infographics still had small (~17-21px) body,
  caption, and quote-attribution text after the earlier "larger text"
  regeneration pass — that prompt only reliably enlarged headlines, not
  full-sentence text. Lesson 6 had never been regenerated at all (blocked
  by Canva's AI generation quota).
- Used Canva's `read-design`/`edit-design` tools to bump `font_size`
  directly on the small text elements in each existing design (no AI
  generation quota consumed), verified each change against a before/after
  thumbnail for overlap before committing, then re-exported and re-ran the
  admin import pipeline (`app/admin/import-lesson-images/page.tsx` →
  `app/api/admin/import-lesson-image/route.ts`) to pull the fixed PNGs
  into Storage. Lessons 1 and 5 already had large, readable text and were
  left untouched.

## 2026-08-25 — Focus mode now survives Next/Previous
- Focus mode was plain component state, so clicking Next/Previous — a
  real navigation to a new lesson page that remounts the component —
  silently dropped the user back to the normal layout. Now persisted in
  sessionStorage (same pattern as `preview-mode-context`), so it stays on
  across lessons until "Exit focus mode" is clicked explicitly.

## 2026-08-25 — Focus mode on lessons
- `components/app-shell.tsx`: new optional `focusMode` prop. When on (and
  signed in), the sidebar, topbar, and preview-mode banner are hidden
  entirely so the page's own content gets the full screen — the page
  itself still renders everything else, AppShell just stops wrapping it
  in the usual chrome.
- Lesson-detail page gets a "Focus mode" / "Exit focus mode" toggle next
  to the back link. Also widens the content column from `max-w-5xl` to
  `max-w-7xl` while focused, since there's no sidebar competing for width
  anymore. The 85vh-tall matched columns from the earlier layout change
  scale naturally with the extra vertical room this frees up.

## 2026-08-25 — Matched-height lesson layout + more infographics regenerated
- `app/courses/[slug]/lessons/[lessonId]/page.tsx`: the infographic column
  and the Read/Listen/Watch card now share a fixed height (`640px` on
  desktop) instead of the image just running however long it ran and the
  text column being separately sized. Each column scrolls independently
  inside that fixed height when its own content is taller, so neither one
  stretches the layout or gets cut off. This is the single shared
  lesson-detail template, so it applies to every lesson in every course
  automatically — nothing per-course to redo later.
- Fixed a caching bug in the admin import route: the storage path is
  always `${lessonId}.png`, so reimporting a fixed infographic overwrote
  the same URL, which the browser kept serving stale cached bytes for.
  The stored `image_url` now includes a `?v=<timestamp>` cache-buster so
  every import is treated as a fresh resource.
- Regenerated lessons 1, 3, and 4's infographics too (on top of lesson
  2's earlier fix) — the original prompt allowed smaller caption text
  under each headline, which rendered too small to read. All four now
  use a tightened brief requiring every piece of text, not just
  headlines, to be large and legible.
- Lessons 5 and 6 still need the same regeneration but Canva's generation
  quota was hit mid-batch — picking this back up once it resets.

## 2026-08-25 — Interactive block sizing + lesson 2 infographic regenerated
- `components/lesson-blocks.tsx`: knowledge-check, try-this, and scenario
  cards now share a consistent `min-h-[220px]` so they don't look wildly
  different in height lesson to lesson. Any text area that could run long
  (reveal content, question text, explanation, checklist, scenario outcome)
  is capped at a max height with internal scroll instead of stretching the
  card — keeps the reading rhythm uniform without truncating content.
  Checklist and explanation text also bumped from `text-xs` to `text-sm`.
- Found a real content bug: lesson 2's Canva infographic had a section
  with garbled, nonsense placeholder text baked into the image (a Canva
  generation artifact, not something CSS can fix since it's pixels in a
  PNG). Regenerated it with a tighter brief — exactly 4 sections, large
  legible text, explicitly no filler/placeholder/invented quotes — and
  swapped it into `lessons.image_url` via the admin import route.
- Trimmed `app/admin/import-lesson-images/page.tsx` back down to just this
  one lesson for the reimport; the other 5 pilot infographics are
  unaffected.

## 2026-08-25 — Dark-mode contrast pass on fixed-light backgrounds
- Found the same class of bug in two more places: any element with a
  hardcoded light background (not a theme-aware `bg-card`/`bg-secondary`
  token) paired with inherited/default text color goes invisible in dark
  mode, since the default text color flips to near-white.
- `components/lesson-blocks.tsx`: the knowledge-check card's question text
  and its correct/incorrect answer states sit on fixed `bg-amber-50` /
  `bg-emerald-100` / `bg-destructive/10` — all now force `text-black`.
- `components/notification-bell.tsx`: unread notifications get a
  `bg-amber-100/60` highlight; title/body/timestamp now force black text
  (at reduced opacity for the secondary lines) only on unread rows — read
  rows keep the normal theme-aware muted-foreground color.
- Audited the rest of the fixed-light-background usages app-wide (badges,
  preview-mode banner, chat bubble) — those already had explicit
  `text-black` set, so this was scoped to the two components above.

## 2026-08-25 — Fixed unreadable lesson-row hover in dark mode
- The mustard hover on course lesson rows used the theme's default text
  color, which is near-white in dark mode — unreadable against the light
  amber background. Lesson title, duration, and lock icon now force black
  text on hover regardless of theme (`group-hover:text-black`).

## 2026-08-25 — Interactive lesson content (Read tab)
- Migration `add_lesson_content_blocks`: new `lessons.content_blocks` jsonb
  column — an array of typed blocks (paragraph, list, reveal, knowledge
  check, try-this, scenario) instead of plain text. Falls back to the
  existing `body_text` when a lesson hasn't been authored in this format.
- New `components/lesson-blocks.tsx` renders each block type as its own
  small interactive React component: click-to-reveal cards, a quick
  multiple-choice check with instant right/wrong feedback, a "try this"
  self-check exercise with a scratch textarea (not saved — just for the
  learner to think it through), and a branching scenario with per-choice
  outcomes. All styled to match the existing neo-brutalist components.
- Rewrote all 6 "Claude for Virtual Assistants" lessons into this format —
  each mixes several block types rather than being a wall of text, and the
  contracts lesson (`Analyzing Contracts and Documents Safely`) includes a
  branching scenario about how far to trust Claude's flags on a clause.
- Lesson-detail page's Read tab now prefers `content_blocks` over
  `body_text` when present, so this is backward compatible with any
  future lesson written the simpler plain-text way.

## 2026-08-25 — Admin preview sees premium content
- Found and fixed a real gap: the course page never actually checked the
  signed-in user's plan — every premium lesson always showed "Upgrade,"
  even for genuine Pro/Team subscribers. Both `app/courses/[slug]/page.tsx`
  and the new lesson-detail page now compute `hasPremiumAccess` from
  `profile.plan` and unlock premium lessons for real Pro/Team users.
- Admins in "Preview as Learner" mode also get `hasPremiumAccess`, so they
  can review what paid content actually looks like without needing a
  second paid test account.
- Migration `allow_admin_bypass_premium_lesson_gating`: extended the
  `lesson_completions` insert/update RLS policies to also allow the row
  when `profiles.role = 'admin'`, not just `plan in (pro, team)` — so
  clicking "Mark complete" on a premium lesson while previewing as an
  admin doesn't silently fail against the database.

## 2026-08-25 — Mustard hover on lesson rows
- Lesson cards on the course page now highlight `amber-300` (the same
  mustard used for the preview-mode banner) on hover, matching the
  existing brand palette instead of introducing a new color.

## 2026-08-25 — Lesson content, pilot (text)
- Found that lessons had no actual content — just title/duration metadata
  with a "mark complete" checkbox and nowhere for the lesson title to link
  to. Fixed the data model and built the missing page.
- Migration `add_lesson_content_formats`: added `body_text`, `audio_url`,
  `video_url` columns to `lessons`, so a lesson can carry a written version,
  an audio narration, and a video explainer independently.
- New `app/courses/[slug]/lessons/[lessonId]/page.tsx` — lesson-detail page
  with Read / Listen / Watch tabs. Falls back to "isn't ready yet" per tab
  when that format's column is empty, rather than hiding the tab entirely,
  so the UI is consistent even for courses that don't have all 3 formats
  yet. Respects the same Pro-gating as the course list (`profile.plan`
  check) — premium lessons show an upgrade prompt instead of content for
  Free-plan users. Includes Mark complete + Previous/Next lesson nav.
- Course list page (`app/courses/[slug]/page.tsx`) — lesson titles now link
  to the new detail page instead of being plain text.
- Wrote the pilot course's text content in full: all 6 lessons of "Claude
  for Virtual Assistants." Audio and video are not yet populated for this
  course — see below.
- Audio: blocked. Tried free TTS (gTTS) from the build sandbox; blocked by
  the sandbox's network allowlist. Real audio narration needs a paid TTS
  provider (OpenAI TTS, ElevenLabs, etc.) and an API key — parked pending
  that decision.
- Video: planned as a slide/motion-graphics explainer (no real screen
  recording of the underlying AI tools — not something that can be
  produced at this scale from here). Pipeline not yet built.
- Remaining ~31 courses still have no lesson content in any format —
  this pilot proves the format before batch-writing the rest.

## 2026-08-25 — Favicon
- Added `app/icon.svg` — the browser tab was showing Chrome's default
  globe icon because no favicon existed at all. New icon reuses the
  existing brand mark from `components/logo.tsx` (black-bordered indigo
  square, bold white up-arrow) so the tab icon matches the in-app logo.
  Picked up automatically by Next.js's file-based icon convention, no
  metadata/layout changes needed.

## 2026-08-15 — In-app notifications, Phase 1
- New `notifications` table (migration `add_notifications`): `type`,
  `title`, `body`, `link`, `related_id` (ties a notification back to the
  course/path/payment it's about, for idempotency), `read_at`. RLS lets a
  user read and mark-read only their own rows — no insert policy for
  regular users, so notifications can only ever be created server-side
  (service role), never spoofed by a client.
- New `lib/notifications.ts` — `createNotification()`, the only way any
  notification gets written. Skips the insert entirely if the user has
  `notify_in_app` off, and is idempotent per (user, type, related_id) so
  retries/repeat triggers never create duplicates.
- Wired into the trigger points that already existed in the code:
  - `app/api/billing/webhook/route.ts` — `payment_success` on a
    successful charge, `payment_failed` on a failed one.
  - `app/api/cron/renew-subscriptions/route.ts` — `plan_downgraded` when
    the downgrade sweep reverts someone to Free.
  - New `app/api/notifications/progress-check/route.ts` — re-derives
    quiz-passed / course-certificate-earned / Learning-Path-certificate-
    earned server-side from `lesson_completions` and `quiz_attempts`
    (never trusts a client-supplied "I passed" flag) and notifies
    accordingly. Called from both `app/quiz/[id]/page.tsx` (right after a
    passing submission) and `app/courses/[slug]/page.tsx` (right after
    marking a lesson complete) — a certificate can be "newly earned" from
    either action depending on which someone does last, so both call it.
- New `components/notification-bell.tsx` — bell icon + unread badge in
  `AppTopbar`, dropdown of the 20 most recent notifications, polls every
  60s (no websocket/Realtime infrastructure yet — plenty for this
  volume). Reading and marking-read go straight to Supabase from the
  browser under RLS; no API route needed for that half.
- Fixed a related gap while wiring this up: `app/settings/page.tsx`'s
  tabs ignored the URL entirely (`Tabs defaultValue="profile"` was
  hardcoded), so a notification linking to `/settings?tab=billing` would
  have silently landed on the Profile tab. Settings now reads `?tab=` and
  opens on the requested tab if it's valid, falling back to Profile
  otherwise.
- Verified: full `npx tsc --noEmit` pass. Full `next build` timed out in
  the sandbox before finishing (unrelated to this change — the build
  compiles 32 course pages) so it wasn't confirmed end-to-end there, but
  the exact `useSearchParams` pattern added to Settings is already used
  successfully in three other pages in this codebase
  (`/billing/success`, `/billing/cancel`, `/auth`), all live in
  production.

## 2026-08-15 — Search boxes on admin Console
- Console → All courses and All users both had lists expected to grow long
  over time with no way to narrow them down. Added a search `Input` to
  each card header: courses filter by title, users filter by name or
  email, both case-insensitive substring match, live as you type.
- Empty state distinguishes "no data at all" from "no results for this
  search" (`No courses match "x"` vs `No courses yet.`).
- Verified: full `npx tsc --noEmit` pass.

## 2026-08-15 — Course content quality review (data only, no code changes)
- Full review of all 33 courses across four dimensions: quiz accuracy,
  lesson title specificity/progression, level (Beginner/Intermediate/
  Advanced) consistency, and free/Pro split fairness.
- **Retired** `workflow-automation-with-zapier` ("Workflow Automation with
  Zapier & Make") — orphaned legacy content from before the standardized
  course format, `tool_slug` was null (never linked from the tool
  directory), no quiz, no free/Pro split, and fully superseded by the
  dedicated `zapier-for-vas` and `make-for-vas` courses. Deleted the
  course and its 3 lessons; confirmed no references existed in
  `learning_path_courses`, `user_progress`, `quiz_attempts`, or
  `lesson_completions` before deleting.
- **Fixed**: `windsurf-for-vas` was labeled Beginner while `cursor-for-vas`
  and `github-copilot-for-vas` — the same category of tool (AI-assisted
  code editor), nearly identical lesson structure and audience — were both
  Intermediate. Bumped Windsurf to Intermediate to match its actual peers.
- **Fixed**: `ai-fundamentals-for-vas` (the designated Free-tier starter
  course) only had 2 quiz questions versus the standard 5 everywhere else
  — thin for a pass/fail certificate gate, and it's the first thing most
  people see. Added 3 more questions in the same style, covering the
  course's existing 3 lesson topics (choosing the right tool, reviewing AI
  output, what makes a workflow "automated").
- **Reviewed, no issues found**: quiz answer-index correctness across all
  ~165 questions (every `answer_index` matched the objectively correct
  option); lesson title specificity and progression (all 32 standardized
  courses follow a consistent, sensible arc — context → core skill →
  practical use case → [Pro] advanced feature → integration/scale →
  building a repeatable client workflow); free/Pro split fairness (the 3
  free lessons consistently deliver real standalone value, the 3 Pro
  lessons consistently add advanced/workflow value that justifies
  upgrading — no course found short-changing either tier).
- Total course count: 33 → 32 after retiring the duplicate.

## 2026-08-15 — Real recurring billing scaffolding via Maya Vault
- Context: the existing Checkout flow is "pay again next period," not
  actual auto-renewal. Lex confirmed the goal is genuine SaaS billing —
  charged automatically each month unless canceled — which needs Maya
  Vault (save a card, charge it again later) plus our own scheduler, since
  Maya has no built-in subscription concept (confirmed in their docs).
  Lex can't do anything on Maya's end right now (PBM Business Profile
  blocker), so this is everything buildable on our end in the meantime.
- Migration `add_vault_recurring_billing_columns` — added
  `maya_customer_id`, `maya_card_token_id`, `card_brand`, `card_last4`,
  `failed_renewal_attempts`, `next_billing_attempt_at` to `subscriptions`.
- `lib/maya.ts` — added `createVaultCustomer()`, `createCardOfCustomer()`,
  `createCustomerPayment()`, matching Maya's Create Customer / Create Card
  of Customer / Create Customer Payment endpoints (field names confirmed
  live against `developers.maya.ph` docs).
- New `app/api/cron/renew-subscriptions/route.ts` + `vercel.json` (daily
  Vercel Cron, needs `CRON_SECRET` set in Vercel to actually run). Does
  two things: (1) charges any subscription's vaulted card again once its
  period ends — currently a no-op since nothing populates a card token
  yet, see below; (2) downgrades `profiles.plan` back to `free` for
  canceled subscriptions past their period end, subscriptions that
  exhausted 3 renewal retries, or non-vaulted subscriptions nobody
  manually renewed. **Part 2 is fully live today** — this is what
  actually enforces "you stop being Pro once you stop paying," which
  nothing did before this.
- `app/api/billing/webhook/route.ts` — `PAYMENT_SUCCESS` now also sets
  `next_billing_attempt_at` and resets `failed_renewal_attempts`;
  `PAYMENT_FAILED` now increments `failed_renewal_attempts` and schedules
  a retry in 2 days instead of just marking `past_due` with no follow-up.
- **Deliberately not built yet: the card-capture form.** Real auto-charge
  needs a form that tokenizes raw card details client-side via Maya's
  Create Payment Token endpoint before any card can be vaulted. The exact
  field names for that request weren't visible in Maya's public docs (the
  interactive schema needs a logged-in session) — rather than guess at a
  shape for a form handling real card numbers, this is parked until
  confirmed directly from Maya's API reference once sandbox access
  exists. Full spec for the remaining 3 steps is in
  `Maya_Billing_Implementation_Plan.md` section 5A.
- Verified: full `npx tsc --noEmit` pass. Not deployable-tested (no
  working Maya sandbox keys right now — see the parked PBM blocker).

## 2026-08-15 — Content gating: premium lessons + AI Tutor
- **Premium lesson completions, DB-level.** The lesson viewer already hid
  the "Mark complete" button for premium lessons for Free users (shows
  Lock + "Upgrade" instead), but the `lesson_completions` RLS policy only
  checked `auth.uid() = user_id` — nothing stopped a Free user from writing
  a completion row directly via the API, bypassing the UI. New migration
  `gate_premium_lesson_completions_by_plan` splits the old catch-all policy
  into separate select/delete (still open to the row's owner) and
  insert/update policies that also require `profiles.plan in ('pro',
  'team')` whenever the lesson being completed is premium.
- **AI Tutor, split by design decision.** The "Ask us" chat bubble
  (`components/chat-widget.tsx`) is one component mounted on every page —
  it doubles as the pre-signup marketing FAQ bot and the "AI Tutor" the
  pricing copy promises Pro/Team. Decision: keep the canned-FAQ path
  (`lib/chat-faq.ts`) open to everyone, including anonymous visitors, since
  it helps pre-signup conversion; gate only the live AI model call behind a
  signed-in Pro/Team plan. `app/api/chat/route.ts` now reads the caller's
  Supabase access token (sent as a Bearer header from the widget, same
  pattern as the billing routes), looks up `profiles.plan` via the service
  role client, and returns a friendly upgrade/sign-in prompt instead of
  calling Anthropic if the caller isn't signed in or isn't Pro/Team. FAQ
  matches still short-circuit before any of this runs, so most traffic is
  unaffected.
- Verified: full `npx tsc --noEmit` pass.

## 2026-08-15 — Fixed live checkout failure, confirmed working
- Live "Choose Pro/Team" was failing with "Couldn't start checkout. Please
  try again." Root cause: `SUPABASE_SERVICE_ROLE_KEY` was never set in
  Vercel, so `getServiceRoleClient()` (`lib/supabase/server.ts`) threw as
  soon as the checkout route tried to write a `checkout_sessions` row — by
  design, that helper has no fallback value since it's a real secret. User
  added the key in Vercel and redeployed. Confirmed working: clicking
  Choose Pro/Team now successfully reaches Maya's hosted sandbox checkout
  page. No code changes — env var only.
- Full outstanding-work punch list moved into
  `Maya_Billing_Implementation_Plan.md` (Status section) so nothing gets
  lost: an actual sandbox payment has not yet been run end-to-end through
  the webhook, no scheduled downgrade job exists, no content gating yet,
  still on Maya's shared sandbox keys, DTI registration for LEX.CR8.IT
  still in progress, and the section 8 testing checklist is still
  untouched. See that doc for the full list with checkboxes.

## 2026-08-15 — Manage subscription / Cancel plan
- Settings → Billing now shows real subscription details for paying users:
  renewal date, payment method on file, and a "Cancel plan" button. New
  `app/api/billing/cancel/route.ts` marks the subscription `canceled`
  (verifies the caller's Supabase access token first, same pattern as the
  checkout route).
- **Important gap surfaced while building this**: the current checkout flow
  uses Maya's one-time Checkout endpoint per billing period, not a live
  Maya-side recurring subscription — nothing on Maya's end auto-charges
  next cycle. Renewal today is effectively "come back and pay again next
  period," not silent auto-renewal, which is why Cancel doesn't call Maya
  at all (there's nothing there to cancel) and why the Billing tab now says
  so explicitly rather than implying auto-renewal that isn't real. Genuine
  auto-renewal would need Maya Vault (save a card, charge it again later
  via a scheduled job) wired up separately — not built yet.
- Related, also not built yet: nothing currently downgrades `profiles.plan`
  back to `free` once `current_period_end` passes, whether from a
  cancellation or just non-renewal. That needs the same scheduled job
  flagged in the original implementation plan for past-due grace periods —
  worth doing as one job that handles both cases together.
- Verified: full `npx tsc --noEmit` pass.

## 2026-08-15 — Maya Checkout billing wired up (sandbox)
- Replaced the mock Billing tab (Settings → Billing previously just set
  local UI state and showed "isn't wired up to real billing yet") with a
  real Maya Checkout integration — cards and GCash, both PHP and USD —
  running against Maya's sandbox environment for now, since production
  requires the LEX.CR8.IT Maya Business account to be approved first (see
  `Maya_Billing_Implementation_Plan.md`).
- New Supabase tables: `subscriptions` (source of truth for billing state),
  `payment_events` (webhook audit log + idempotency, keyed on
  `(maya_payment_id, payment_status)` since Maya's webhook payload has no
  separate event id and the same payment id legitimately gets multiple
  statuses over its life), and `checkout_sessions` (bridges a
  `requestReferenceNumber` back to the user/plan that started it, so the
  webhook doesn't have to depend on Maya echoing back arbitrary metadata).
  Also added `profiles.plan` (`free`/`pro`/`team`) as a fast denormalized
  read for gating checks, only ever written by the webhook handler.
- New `lib/maya.ts` — Basic Auth header builder, `createCheckout()`,
  `getPayment()`, and the webhook IP allowlist. Correction from the first
  draft of the implementation plan: Maya doesn't sign webhooks with a
  shared secret like Stripe — it restricts delivery to fixed source IPs
  instead, verified against Maya's actual API docs before building this.
- New `app/api/billing/checkout/route.ts` — verifies the caller's Supabase
  access token server-side (not just trusting a client-supplied user id),
  records a `checkout_sessions` row, then creates a Maya Checkout session
  and returns the hosted checkout URL.
- New `app/api/billing/webhook/route.ts` — checks the request's source IP
  against Maya's allowlist, handles `PAYMENT_SUCCESS` (activates the plan),
  `PAYMENT_FAILED` (marks `past_due`, plan stays active for a grace period —
  exact length still an open decision), and `PAYMENT_CANCELLED` (marks
  `canceled`). Idempotent against Maya's webhook retries.
- New `app/billing/success/page.tsx` and `app/billing/cancel/page.tsx` —
  the success page polls the user's own profile for a few seconds waiting
  for the webhook to land, rather than claiming success the instant Maya
  redirects back (the redirect alone doesn't confirm payment).
- Settings → Billing now calls the real checkout route and redirects to
  Maya; "Current: Free" badge reads the real `profile.plan` instead of
  being hardcoded, and the "Current" badge on plan cards is accurate for
  Pro/Team too, not just Free.
- Content gating (premium lessons, AI Tutor) is intentionally **not** wired
  up yet — still waiting on your call on exact Free-tier AI Tutor access
  before building that part, per the implementation plan's open questions.
- Verified: full `npx tsc --noEmit` pass. Request/response shapes checked
  directly against Maya's official API docs (developers.maya.ph). A live
  end-to-end call couldn't be tested from this sandbox's shell (its network
  egress doesn't reach external payment APIs) — first real test will need
  to happen from the deployed Vercel environment.

## 2026-08-14 — Trimmed redundant "Admin" wording, moved Recent errors to the top
- The admin nav said "admin" three times over: a purple "Admin mode" badge
  in the sidebar, an "Admin Overview" nav label right below it, and an
  "Admin" heading with a red "Admin only" badge on the page itself.
  Trimmed it down: sidebar nav label is now just "Overview" (the "Admin
  mode" badge already sets the context), and the page heading is now
  "Console" — named for what the page does — with the redundant "Admin
  only" badge removed.
- Moved the "Recent errors" card from the bottom of `/admin` to the top,
  above "All courses" / "All users" — it's the thing an admin most needs
  to notice first, not something to scroll past two other cards to find.

## 2026-08-14 — Sidebar logo no longer links out to the landing page
- The logo at the top of the signed-in sidebar (`DashboardSidebar`, shared
  by both learner and admin views) linked to `/`, the marketing landing
  page — so clicking it while signed in dropped the user (admin or
  learner) out of the app entirely.
- Changed it to a plain, non-clickable wordmark. The landing page isn't
  part of the signed-in experience; Overview / Admin Overview is the
  actual "home" and is already one click away in the nav below it.

## 2026-08-14 — Find Your Path quiz: multi-select answers + multiple recommendations
- Questions were single-select (one answer picks one option), which forced
  a learner to pick just one interest per question even when several
  applied. Changed every question to multi-select — answers now toggle on
  and off, with a checkbox-style indicator, and the "select all that apply"
  hint added under each question.
- Results changed from a single winner-take-all pick to a ranked shortlist
  of up to 3 Learning Paths (any path scoring above zero, sorted by score,
  capped at 3), so a learner whose answers genuinely span two interests
  (e.g. both content creation and coding support) sees both instead of an
  arbitrary tie-break picking one.
- Re-verified all 11 paths are still reachable as a top-3 result under the
  new multi-select scoring via a Node simulation (one pass per path,
  selecting every option relevant to that path's trait profile) — all 11
  passed.

## 2026-08-14 — Preview-mode banner recolored to yellow
- Changed `PreviewModeBanner` from the neutral `bg-secondary` gray to
  `bg-amber-300` (matching the "Ask us" bubble) so it pops instead of
  blending into the surrounding blue-heavy UI.

## 2026-08-14 — Preview-mode banner now shows on every page, redundant sidebar "Back to Admin" removed
- The "You're previewing the learner dashboard as an admin" banner (with
  its "Back to Admin" button) only rendered on `/dashboard`, so navigating
  to Tools, Courses, Paths, or Settings while previewing lost the visible
  way back — the only exit was a "Back to Admin" link buried at the bottom
  of the sidebar.
- Extracted the banner into `components/preview-mode-banner.tsx` and
  rendered it from `AppShell` (so it now shows on every signed-in catalog
  page) and from `/dashboard` directly. It's the single "Back to Admin"
  control now.
- Removed the sidebar's own "Back to Admin" link since the banner made it
  redundant — the sidebar keeps just the "Preview as Learner" entry point,
  which only shows in admin mode.

## 2026-08-14 — Preview as Learner no longer resets when navigating away from Dashboard
- Bug: "Preview as Learner" was tracked only as a `?preview=1` query param on
  `/dashboard`, passed down as a prop to the sidebar. Every other page the
  sidebar renders on (`/tools`, `/courses`, `/paths`, `/settings`,
  `/find-your-path`) called it with no prop, so it silently defaulted back
  to admin mode the instant the admin clicked into any of those — dropping
  them out of preview without ever touching "Back to Admin."
- Fixed by moving preview state out of the URL and into a new app-wide
  `PreviewModeProvider` (`lib/preview-mode-context.tsx`), persisted to
  `sessionStorage` so it also survives a page reload. It now only changes
  when the admin explicitly clicks "Preview as Learner" or "Back to Admin."
- `components/dashboard-sidebar.tsx` and `app/dashboard/page.tsx` now read
  `usePreviewMode()` instead of a query param / prop; `app/dashboard/page.tsx`
  no longer needs `useSearchParams()`, so the `<Suspense>` wrapper it
  required was removed too.
- Added a `loading` flag to the preview context so `/dashboard` waits for
  the `sessionStorage` read to finish before deciding whether to redirect
  an admin to `/admin` — otherwise a hard reload while previewing would
  briefly look like "not previewing" and bounce them out.

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
