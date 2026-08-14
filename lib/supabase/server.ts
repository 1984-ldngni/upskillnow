import { createClient } from "@supabase/supabase-js";

// Server-only Supabase helpers. Never import this from a "use client" file.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nososmapqfrinvefuzmv.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc29zbWFwcWZyaW52ZWZ1em12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzIxODksImV4cCI6MjEwMjE0ODE4OX0.WTqKONse5jN2O6k0bWIVAJF-SSUlwQhCzDh3OO4jQzk";

// Bypasses RLS entirely — only ever use this for server-to-server logic that
// has already established trust some other way (e.g. a verified Maya
// webhook). Never expose this key or a client built from it to the browser.
// No hardcoded fallback here on purpose: unlike the anon key, this one is a
// real secret and must come from Vercel's environment variables.
export function getServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — add it in Vercel's environment variables (Supabase project settings → API → service_role key)."
    );
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Verifies a client-supplied access token against Supabase itself (not just
// trusting a client-supplied user id) and returns the authenticated user, or
// null if the token is missing/invalid/expired.
export async function getUserFromAccessToken(accessToken: string | null) {
  if (!accessToken) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}
