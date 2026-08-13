import { getSupabaseClient } from "@/lib/supabase/client";

type LogLevel = "error" | "warning" | "info";

type LogOptions = {
  level?: LogLevel;
  context?: Record<string, unknown>;
  path?: string;
};

// Fire-and-forget: logging must never be the thing that breaks the app.
// Every call is wrapped so a Supabase outage or RLS hiccup here just gets
// silently dropped instead of throwing on top of whatever already failed.
export function logClientError(message: string, opts: LogOptions = {}): void {
  void (async () => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("error_logs").insert({
        user_id: user?.id ?? null,
        level: opts.level ?? "error",
        message: message.slice(0, 2000),
        context: opts.context ?? null,
        path: opts.path ?? (typeof window !== "undefined" ? window.location.pathname : null),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
    } catch {
      // swallow — see comment above
    }
  })();
}

export type LoggedError = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  level: LogLevel;
  message: string;
  context: Record<string, unknown> | null;
  path: string | null;
  createdAt: string;
};

export async function getRecentErrorLogs(limit = 50): Promise<LoggedError[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("error_logs")
    .select("id, user_id, level, message, context, path, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.profiles?.email ?? null,
    level: row.level,
    message: row.message,
    context: row.context,
    path: row.path,
    createdAt: row.created_at,
  }));
}
