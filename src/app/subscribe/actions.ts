"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "../../lib/supabase/server";
import { resolveSiteContext } from "../../lib/sites";

function redirectWithMessage(path: string, message: string) {
  const encoded = encodeURIComponent(message);
  redirect(`${path}?message=${encoded}`);
}

export async function subscribeAction(formData: FormData) {
  const { site } = await resolveSiteContext();

  if (!site) {
    redirectWithMessage("/subscribe", "Site not found.");
  }

  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!rawEmail) {
    redirectWithMessage("/subscribe", "Email is required.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("subscribers").upsert(
    {
      site_id: site!.id,
      email: rawEmail,
      status: "active",
      unsubscribed_at: null,
    },
    { onConflict: "site_id,email" }
  );

  if (error) {
    redirectWithMessage("/subscribe", error.message);
  }

  redirectWithMessage("/subscribe", "You are subscribed.");
}

export async function unsubscribeAction(formData: FormData) {
  const { site } = await resolveSiteContext();

  if (!site) {
    redirectWithMessage("/unsubscribe", "Site not found.");
  }

  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!rawEmail) {
    redirectWithMessage("/unsubscribe", "Email is required.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("subscribers").upsert(
    {
      site_id: site!.id,
      email: rawEmail,
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    },
    { onConflict: "site_id,email" }
  );

  if (error) {
    redirectWithMessage("/unsubscribe", error.message);
  }

  redirectWithMessage("/unsubscribe", "You are unsubscribed.");
}
