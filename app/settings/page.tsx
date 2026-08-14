"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { loading, userId, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.push("/auth?next=/settings");
    }
  }, [loading, userId, router]);

  useEffect(() => {
    setFullName(profile?.fullName ?? "");
  }, [profile?.fullName]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", userId);
      if (updateError) throw updateError;
      await refreshProfile();
      setSaved(true);
    } catch {
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <AppShell maxWidth="max-w-xl">
      <h1 className="font-heading text-3xl font-black">Profile settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your account details.</p>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Your info</CardTitle>
            {isAdmin && <Badge variant="purple">Admin</Badge>}
          </div>
          <CardDescription>This name shows up on your certificates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSaved(false);
              }}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Email can't be changed here yet — contact support if you need it updated.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <p className="text-sm font-medium text-emerald-600">Saved.</p>}
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Sign out</CardTitle>
          <CardDescription>Sign out of UpSkillNow on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
