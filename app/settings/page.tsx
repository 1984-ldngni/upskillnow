"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type Theme } from "@/lib/theme-context";
import { PLANS, type Currency, type PlanSlug } from "@/lib/pricing";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LogOut, Sun, Moon, Monitor, User, Bell, Palette, CreditCard, Calendar } from "lucide-react";

type SubscriptionRow = {
  plan: "pro" | "team";
  currency: "PHP" | "USD";
  status: "active" | "past_due" | "canceled";
  payment_method: "card" | "gcash" | "maya" | null;
  current_period_end: string | null;
  canceled_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: "Card",
  gcash: "GCash",
  maya: "Maya wallet",
};

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun; color: string }[] = [
  { value: "light", label: "Light", icon: Sun, color: "text-amber-500" },
  { value: "dark", label: "Dark", icon: Moon, color: "text-violet-500" },
  { value: "system", label: "System", icon: Monitor, color: "text-sky-500" },
];

const VALID_TABS = new Set(["profile", "notifications", "theme", "billing"]);

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, userId, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Lets links from elsewhere in the app (e.g. notifications) open Settings
  // directly on a specific tab, like /settings?tab=billing, instead of
  // always landing on Profile and making the user click over themselves.
  const requestedTab = searchParams.get("tab");
  const initialTab = requestedTab && VALID_TABS.has(requestedTab) ? requestedTab : "profile";

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  const [billingCurrency, setBillingCurrency] = useState<Currency>("PHP");
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<PlanSlug | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  async function loadSubscription() {
    if (!userId) return;
    setSubscriptionLoading(true);
    const supabase = getSupabaseClient();
    // RLS ("Users read their own subscription") scopes this to the caller's
    // own row automatically — no explicit .eq("user_id", ...) needed, but
    // included anyway for clarity and as a second layer of defense.
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, currency, status, payment_method, current_period_end, canceled_at")
      .eq("user_id", userId)
      .maybeSingle();
    setSubscription(data as SubscriptionRow | null);
    setSubscriptionLoading(false);
  }

  useEffect(() => {
    if (!userId) return;
    loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleCancelSubscription() {
    setCancelError(null);
    setCancelling(true);
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setCancelError("Your session expired — please sign in again.");
        return;
      }
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Couldn't cancel. Please try again.");
        return;
      }
      await loadSubscription();
    } catch {
      setCancelError("Couldn't cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

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

  async function handleChoosePlan(plan: PlanSlug) {
    setCheckoutError(null);
    setCheckoutLoadingPlan(plan);
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setCheckoutError("Your session expired — please sign in again.");
        return;
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan, currency: billingCurrency }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        setCheckoutError(data.error ?? "Couldn't start checkout. Please try again.");
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setCheckoutError("Couldn't start checkout. Please try again.");
    } finally {
      setCheckoutLoadingPlan(null);
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

      <Tabs defaultValue={initialTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 text-primary" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 text-amber-500" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4 text-accent" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 text-emerald-500" />
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
                <LogOut className="mr-2 h-4 w-4 text-destructive" />
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
              {THEME_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button key={value} onClick={() => setTheme(value)}>
                  <Badge
                    variant={theme === value ? "accent" : "outline"}
                    className="flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Icon className={`h-3.5 w-3.5 ${theme === value ? "" : color}`} />
                    {label}
                  </Badge>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-black">Billing</h2>
                  <Badge variant="green">
                    Current: {profile?.plan === "free" ? "Free" : profile?.plan === "pro" ? "Pro" : "Team"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Pick a plan to see what changes.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setBillingCurrency("USD")} aria-pressed={billingCurrency === "USD"}>
                  <Badge variant={billingCurrency === "USD" ? "accent" : "outline"}>USD ($)</Badge>
                </button>
                <button onClick={() => setBillingCurrency("PHP")} aria-pressed={billingCurrency === "PHP"}>
                  <Badge variant={billingCurrency === "PHP" ? "accent" : "outline"}>PHP (₱)</Badge>
                </button>
              </div>
            </div>

            {!subscriptionLoading && subscription && subscription.status !== "canceled" && (
              <div className="rounded-md border-2 border-black bg-secondary p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span>
                      {subscription.status === "past_due" ? (
                        <span className="font-bold text-destructive">
                          Payment failed — please update your payment method.
                        </span>
                      ) : (
                        <>
                          Renews on <span className="font-bold">{formatDate(subscription.current_period_end)}</span>
                          {subscription.payment_method && (
                            <> via {PAYMENT_METHOD_LABEL[subscription.payment_method] ?? subscription.payment_method}</>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" disabled={cancelling} onClick={handleCancelSubscription}>
                    {cancelling ? "Cancelling…" : "Cancel plan"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Renewal today means checking out again each period — it isn't fully automatic yet, so
                  "Renews on" is when your current period ends, not an auto-charge date.
                </p>
              </div>
            )}

            {!subscriptionLoading && subscription?.status === "canceled" && (
              <div className="rounded-md border-2 border-black bg-secondary p-3 text-sm">
                <span className="font-bold">Plan cancelled.</span> You'll keep {profile?.plan === "team" ? "Team" : "Pro"}{" "}
                access until {formatDate(subscription.current_period_end)}.
              </div>
            )}

            {cancelError && <p className="text-xs font-medium text-destructive">{cancelError}</p>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PLANS[billingCurrency].map((p) => {
                const isCurrent = p.slug === (profile?.plan ?? "free");
                const isLoading = checkoutLoadingPlan === p.slug;
                return (
                  <div
                    key={p.name}
                    className={`flex flex-col justify-between rounded-md border-2 border-black p-3 ${
                      isCurrent ? "bg-secondary" : "bg-card"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-heading text-sm font-black uppercase">{p.name}</p>
                        {isCurrent && <Badge variant="green">Current</Badge>}
                      </div>
                      <p className="mt-1 font-heading text-xl font-black">{p.price}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
                    </div>
                    {!isCurrent && p.slug !== "free" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        disabled={checkoutLoadingPlan !== null}
                        onClick={() => handleChoosePlan(p.slug)}
                      >
                        {isLoading ? "Redirecting…" : `Choose ${p.name}`}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {checkoutError && <p className="text-xs font-medium text-destructive">{checkoutError}</p>}

            <p className="text-xs text-muted-foreground">
              Payments are processed by Maya Checkout (cards and GCash) — currently running against
              Maya's sandbox environment, so no real charges happen yet.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </AppShell>
  );
}
