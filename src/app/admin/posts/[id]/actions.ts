"use server";

import { redirect } from "next/navigation";

import { getSelectedSiteId, requireAdminSession } from "../../../../lib/admin";
import { slugify } from "../../../../lib/slug";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

function redirectWithError(postId: string, message: string) {
  const encoded = encodeURIComponent(message);
  redirect(`/admin/posts/${postId}?error=${encoded}`);
}

export async function updateDraftAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    redirect("/admin/sites");
  }

  const postId = String(formData.get("postId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const contentMd = String(formData.get("contentMd") ?? "");

  if (!postId) {
    redirect("/admin/posts");
  }

  if (!title) {
    redirectWithError(postId, "Title is required.");
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const supabase = await createServerSupabaseClient();
  const { data: existingPost, error: fetchError } = await supabase
    .from("posts")
    .select("id, status, slug")
    .eq("id", postId)
    .eq("site_id", siteId)
    .maybeSingle();

  if (fetchError || !existingPost) {
    redirectWithError(postId, fetchError?.message ?? "Draft not found.");
  }

  const post = existingPost!;

  const updates: {
    title: string;
    slug: string;
    content_md: string;
    updated_at: string;
    published_at?: string;
  } = {
    title,
    slug,
    content_md: contentMd,
    updated_at: new Date().toISOString(),
  };

  if (post.status === "published") {
    updates.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("site_id", siteId);

  if (error) {
    redirectWithError(postId, error.message);
  }

  if (post.slug !== slug) {
    await supabase.from("post_slugs").upsert(
      {
        post_id: post.id,
        site_id: siteId,
        slug: post.slug,
      },
      { onConflict: "site_id,slug" }
    );
  }

  redirect(`/admin/posts/${postId}`);
}

export async function publishPostAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    redirect("/admin/sites");
  }

  const postId = String(formData.get("postId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "quiet");
  const scheduleAt = String(formData.get("scheduleAt") ?? "").trim();
  const notify = String(formData.get("notify") ?? "") === "on";

  if (!postId) {
    redirect("/admin/posts");
  }

  if (!["quiet", "notify", "scheduled"].includes(mode)) {
    redirectWithError(postId, "Unknown publish mode.");
  }

  let publishedAt: string | null = new Date().toISOString();
  let status = "published";
  let notifyOnPublish = mode === "notify";

  if (mode === "scheduled") {
    if (!scheduleAt) {
      redirectWithError(postId, "Schedule time is required.");
    }
    const scheduledDate = new Date(scheduleAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      redirectWithError(postId, "Invalid schedule time.");
    }
    if (scheduledDate.getTime() <= Date.now()) {
      redirectWithError(postId, "Schedule time must be in the future.");
    }
    publishedAt = scheduledDate.toISOString();
    status = "scheduled";
    notifyOnPublish = notify;
  }

  if (mode === "quiet") {
    notifyOnPublish = false;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("posts")
    .update({
      status,
      published_at: publishedAt,
      notify_on_publish: notifyOnPublish,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("site_id", siteId);

  if (error) {
    redirectWithError(postId, error.message);
  }

  if (status === "published" && notifyOnPublish) {
    await supabase.rpc("enqueue_post_emails", { post_id: postId });
    redirect(`/admin/posts/${postId}?send=1`);
  }

  redirect(`/admin/posts/${postId}`);
}
