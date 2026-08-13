# UpSkillNow

Initial Next.js (App Router) + Tailwind + shadcn-style scaffold for the UpSkillNow SaaS, built to match `UpSkillNow_SaaS_Architecture_and_Tool_Directory.pdf`.

Pages included (mock data, not yet wired to Supabase):
- `/` — marketing landing page
- `/auth` — sign in / sign up
- `/dashboard` — logged-in user home
- `/tools`, `/tools/[slug]` — tool directory
- `/courses`, `/courses/[slug]` — course catalog + lesson viewer
- `/quiz/[id]` — quiz UI
- `/admin` — admin shell with "View as User" impersonation UI (client-side only for now)

## Next steps (per the technical checklist)
1. Open this project in Cursor.
2. Install deps: `npm install`
3. Connect the Supabase project (`upskillnow`, ref `nososmapqfrinvefuzmv`) — swap mock data in `lib/mock-data.ts` for real Supabase queries.
4. Apply the schema from the architecture doc (`categories`, `subcategories`, `tools`, `tool_skills`, `profiles`).
5. Build the real admin impersonation Edge Function and wire it into `/admin`.
6. Add Gemini API routes (skill assessment, AI tutor, roadmap) and ElevenLabs routes (audio lessons).
