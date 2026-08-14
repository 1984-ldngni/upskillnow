"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { logClientError } from "@/lib/error-logger";

export type CurrentProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  notifyEmail: boolean;
  notifyInApp: boolean;
  plan: "free" | "pro" | "team";
};

const PROFILE_COLUMNS = "id, email, full_name, role, notify_email, notify_in_app, plan";

function mapProfileRow(row: {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  notify_email: boolean | null;
  notify_in_app: boolean | null;
  plan: string | null;
}): CurrentProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    notifyEmail: row.notify_email ?? true,
    notifyInApp: row.notify_in_app ?? true,
    plan: (row.plan as CurrentProfile["plan"]) ?? "free",
  };
}

type AuthState = {
  loading: boolean;
  userId: string | null;
  profile: CurrentProfile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    async function loadProfile(uid: string | null) {
      if (!uid) {
        if (!cancelled) {
          setUserId(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", uid)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        // A profile fetch failure (RLS error, network blip, etc.) used to
        // silently fall back to a null profile, which made a real account
        // quietly look signed-out/non-admin with no trace of why. Log it so
        // it shows up in the admin error log instead of vanishing.
        logClientError(`Profile fetch failed: ${error.message}`, {
          level: "error",
          context: { code: error.code, uid },
        });
      }
      setUserId(uid);
      setProfile(data ? mapProfileRow(data) : null);
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => loadProfile(data.user?.id ?? null));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await getSupabaseClient().auth.signOut();
  }

  async function refreshProfile() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    if (!uid) {
      setUserId(null);
      setProfile(null);
      return;
    }
    const { data: row, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      logClientError(`Profile refresh failed: ${error.message}`, {
        level: "error",
        context: { code: error.code, uid },
      });
    }
    setUserId(uid);
    setProfile(row ? mapProfileRow(row) : null);
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        userId,
        profile,
        isAdmin: profile?.role === "admin",
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
