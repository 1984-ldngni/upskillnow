import { getServiceRoleClient } from "@/lib/supabase/server";

// Server-only. Every notification is written here, from server-side
// trigger points only (billing webhook, renewal/downgrade cron, the
// progress-check route) — never directly by the client, so a user can't
// spoof their own achievements or billing events. See migration
// add_notifications for the RLS policies that enforce this.

export type NotificationType =
  | "quiz_passed"
  | "certificate_earned"
  | "path_certificate_earned"
  | "payment_success"
  | "payment_failed"
  | "plan_downgraded";

export type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  // Ties this notification to the thing it's about (a course id, path id,
  // or subscription id) — used to skip inserting a duplicate if the same
  // achievement/event already notified this user before.
  relatedId?: string;
};

// Respects the user's notify_in_app preference (skips the insert
// entirely if they've turned in-app notifications off, rather than
// writing a row that's just never shown) and is idempotent per
// (user, type, related_id) so retries/repeat triggers don't spam
// duplicates.
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const supabase = getServiceRoleClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("notify_in_app")
    .eq("id", params.userId)
    .maybeSingle();
  if (profile && profile.notify_in_app === false) return;

  if (params.relatedId) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", params.userId)
      .eq("type", params.type)
      .eq("related_id", params.relatedId)
      .maybeSingle();
    if (existing) return;
  }

  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
    related_id: params.relatedId ?? null,
  });
}
