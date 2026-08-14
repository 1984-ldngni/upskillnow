"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type Theme } from "@/lib/theme-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LogOut, Sun, Moon, Monitor, Sparkles, User, Bell, Palette, CreditCard } from "lucide-react";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function SettingsPage() {
  const router = useRouter();
  const { loading, userId, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.push("/auth?next=/settings");
    }
  }, [loading, userId, router]);

  useEffect(() => {
    setFullName(profile?.fullName ?? "");
    if (profile) {
      setNotifyEmail(profile.notifyEmail);
      setNotifyInApp(profile.notifyInApp);
    }
  }, [profile]);

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

  async function handleNotificationChange(next: { notifyEmail: boolean; notifyInApp: boolean }) {
    setNotifyEmail(next.notifyEmail);
    setNotifyInApp(next.notifyInApp);
    setNotifSaving(true);
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("profiles")
        .update({ notify_email: next.notifyEmail, notify_in_app: next.notifyInApp })
        .eq("id", userId);
      await refreshProfile();
    } finally {
      setNotifSaving(false);
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
    <AppShell maxWidth="max-w-2xl">
      <h1 className="font-heading text-3xl font-black">Profile settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your account details.</p>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <div className="relative z-10 -mt-[2px] rounded-b-md rounded-tr-md border-2 border-black bg-card p-6 shadow-brutal">
          <TabsContent value="profile" className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-black">Your info</h2>
                {isAdmin && <Badge variant="purple">Admin</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">This name shows up on your certificates.</p>

              <div className="mt-4 space-y-4">
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
              </div>
            </div>

            <div className="border-t-2 border-black/10 pt-6">
              <h2 className="font-heading text-lg font-black">Sign out</h2>
              <p className="text-sm text-muted-foreground">Sign out of UpSkillNow on this device.</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-5">
            <div>
              <h2 className="font-heading text-lg font-black">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Choose how we reach you about course activity and updates.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">In-app</p>
                <p className="text-xs text-muted-foreground">Show updates inside UpSkillNow.</p>
              </div>
              <Switch
                checked={notifyInApp}
                onCheckedChange={(checked) => handleNotificationChange({ notifyEmail, notifyInApp: checked })}
                disabled={notifSaving}
                aria-label="Toggle in-app notifications"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Email</p>
                <p className="text-xs text-muted-foreground">Get emailed about course progress and new content.</p>
              </div>
              <Switch
                checked={notifyEmail}
                onCheckedChange={(checked) => handleNotificationChange({ notifyEmail: checked, notifyInApp })}
                disabled={notifSaving}
                aria-label="Toggle email notifications"
              />
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-sm font-bold">SMS</p>
                <p className="text-xs text-muted-foreground">Coming soon, once UpSkillNow is a native app.</p>
              </div>
              <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="SMS notifications (coming soon)" />
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <div>
              <h2 className="font-heading text-lg font-black">Theme</h2>
              <p className="text-sm text-muted-foreground">Light, dark, or match your device.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setTheme(value)}>
                  <Badge
                    variant={theme === value ? "accent" : "outline"}
                    className="flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Badge>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-black">Billing</h2>
              <Badge variant="outline">Free plan</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You're on the Free plan. Upgrade to Pro or Team for full-length lessons and more.
            </p>
            <Link href="/#pricing">
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                View plans & upgrade
              </Button>
            </Link>
          </TabsContent>
        </div>
      </Tabs>
    </AppShell>
  );
}
