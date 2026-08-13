import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The anon/publishable key is safe to expose client-side by design —
// Supabase enforces access via Row Level Security policies, not key secrecy.
// Values come from Vercel environment variables now that this project is
// git-connected. The hardcoded strings are a fallback only, so local/dev
// runs and any deploy that hasn't had the env vars set yet still work.
// Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel
// (Project → Settings → Environment Variables) to take these over fully.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nososmapqfrinvefuzmv.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc29zbWFwcWZyaW52ZWZ1em12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzIxODksImV4cCI6MjEwMjE0ODE4OX0.WTqKONse5jN2O6k0bWIVAJF-SSUlwQhCzDh3OO4jQzk";

// IMPORTANT: keep this a singleton. Calling createClient() fresh on every
// invocation spins up a separate GoTrueClient each time, and multiple
// GoTrueClient instances in the same browser tab fight over the same
// localStorage session key — the symptom is exactly "signed in on one page,
// signed out on the next." Reusing one instance keeps auth state consistent
// across the whole app.
let browserClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
