import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PostViewTracker from "@/components/PostViewTracker";
import type { Post } from "@/lib/posts";

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long"
  }).format(new Date(value));
}

export default async function PostDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, tags, content, cover_image_url, reading_time_minutes, published_at, created_at, meta_title, meta_description"
    )
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!data) {
    notFound();
  }

  const post = data as Pick<
    Post,
    | "id"
    | "title"
    | "slug"
    | "tags"
    | "content"
    | "cover_image_url"
    | "reading_time_minutes"
    | "published_at"
    | "created_at"
    | "meta_title"
    | "meta_description"
  >;

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{post.title}</h1>
        <div className="text-xs text-slate-500">
          {formatDate(post.published_at ?? post.created_at)}
          {post.reading_time_minutes ? (
            <span> · {post.reading_time_minutes} min read</span>
          ) : null}
        </div>
        {post.tags?.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-slate-200 px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>
      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="max-h-[420px] w-full rounded-lg object-cover"
        />
      ) : null}
      <div className="prose max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      <PostViewTracker postId={post.id} />
    </article>
  );
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("title, meta_title, meta_description, cover_image_url")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!data) {
    return {};
  }

  const title = data.meta_title || data.title;
  const description = data.meta_description || undefined;

  return {
    title,
    description,
    openGraph: data.cover_image_url
      ? {
          title,
          description,
          images: [data.cover_image_url]
        }
      : undefined
  };
}
