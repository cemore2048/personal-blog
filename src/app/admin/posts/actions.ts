"use server";

import { redirect } from "next/navigation";

import { getSelectedSiteId, requireAdminSession } from "../../../lib/admin";
import { slugify } from "../../../lib/slug";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function redirectWithError(message: string) {
  const encoded = encodeURIComponent(message);
  redirect(`/admin/posts?error=${encoded}`);
}

export async function createDraftAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    redirect("/admin/sites");
  }

  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();

  if (!title) {
    redirectWithError("Title is required.");
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      site_id: siteId,
      title,
      slug,
      status: "draft",
      notify_on_publish: false,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError(error?.message ?? "Unable to create draft.");
  }

  redirect(`/admin/posts/${data!.id}`);
}

export async function deleteDraftAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    redirect("/admin/sites");
  }

  const postId = String(formData.get("postId") ?? "").trim();

  if (!postId) {
    redirectWithError("Missing post id.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("site_id", siteId);

  if (error) {
    redirectWithError(error.message);
  }

  redirect("/admin/posts");
}
