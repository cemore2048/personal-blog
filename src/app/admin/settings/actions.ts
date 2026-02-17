"use server";

import { redirect } from "next/navigation";

import { getSelectedSiteId, requireAdminSession } from "../../../lib/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function updateEmailSettingsAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    redirect("/admin/sites");
  }

  const enabled = formData.get("emailEnabled") === "on";
  const emailFrom = String(formData.get("emailFrom") ?? "").trim();
  const senderName = String(formData.get("emailSenderName") ?? "").trim();

  if (enabled && !emailFrom) {
    redirect("/admin/settings?error=Email%20from%20address%20is%20required.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("sites")
    .update({
      email_enabled: enabled,
      email_from: emailFrom || null,
      email_sender_name: senderName || null,
    })
    .eq("id", siteId);

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/settings?success=Saved.");
}
