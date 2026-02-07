"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUniqueSlug } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseTags(value: string) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function estimateReadingTimeMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (!words) {
    return 0;
  }
  return Math.max(1, Math.round(words / 200));
}

function normalizeText(value: FormDataEntryValue | null) {
  if (!value) {
    return "";
  }
  return String(value).trim();
}

export async function savePost(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const title = normalizeText(formData.get("title"));
  const content = normalizeText(formData.get("content"));
  const excerpt = normalizeText(formData.get("excerpt")) || null;
  const coverImageUrl = normalizeText(formData.get("coverImageUrl")) || null;
  const metaTitle = normalizeText(formData.get("metaTitle")) || null;
  const metaDescription = normalizeText(formData.get("metaDescription")) || null;
  const tags = parseTags(normalizeText(formData.get("tags")));
  const intent = normalizeText(formData.get("intent"));
  const status = intent === "publish" ? "published" : "draft";
  const postId = normalizeText(formData.get("postId"));
  const currentSlug = normalizeText(formData.get("currentSlug")) || null;

  if (!title || !content) {
    redirect("/admin");
  }

  const slug = await ensureUniqueSlug({ title, currentSlug });
  const now = new Date().toISOString();
  const readingTimeMinutes = estimateReadingTimeMinutes(content);

  if (postId) {
    const { data: existing } = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", postId)
      .single();

    const publishedAt =
      status === "published" ? existing?.published_at ?? now : null;

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        slug,
        content,
        excerpt,
        tags,
        cover_image_url: coverImageUrl,
        reading_time_minutes: readingTimeMinutes,
        meta_title: metaTitle,
        meta_description: metaDescription,
        status,
        published_at: publishedAt,
        updated_at: now
      })
      .eq("id", postId);

    if (error) {
      redirect("/admin");
    }
  } else {
    const publishedAt = status === "published" ? now : null;

    const { error } = await supabase.from("posts").insert({
      title,
      slug,
      content,
      excerpt,
      tags,
      cover_image_url: coverImageUrl,
      reading_time_minutes: readingTimeMinutes,
      meta_title: metaTitle,
      meta_description: metaDescription,
      status,
      published_at: publishedAt,
      author_id: user.id
    });

    if (error) {
      redirect("/admin");
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/posts/${slug}`);
  redirect("/admin");
}
