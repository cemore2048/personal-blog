import { notFound } from "next/navigation";
import PostForm from "@/components/PostForm";
import { requireAdminUser } from "@/lib/auth";
import type { Post } from "@/lib/posts";

export default async function AdminEditPostPage({
  params
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdminUser();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, tags, content, excerpt, cover_image_url, reading_time_minutes, meta_title, meta_description, status, published_at, created_at, updated_at"
    )
    .eq("id", params.id)
    .single();

  if (!data) {
    notFound();
  }

  return <PostForm heading="Edit post" post={data as Post} />;
}
