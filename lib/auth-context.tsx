"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type CurrentProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
};

type AuthState = {
  loading: boolean;
  userId: string | null;
  profile: CurrentProfile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
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
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", uid)
        .maybeSingle();

      if (cancelled) return;
      setUserId(uid);
      setProfile(
        data
          ? { id: data.id, email: data.email, fullName: data.full_name, role: data.role }
          : null
      );
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

  return (
    <AuthContext.Provider
      value={{ loading, userId, profile, isAdmin: profile?.role === "admin", signOut }}
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
