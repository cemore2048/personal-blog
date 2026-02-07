import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/posts";

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, tags, excerpt, reading_time_minutes, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  const posts = (data ?? []) as Pick<
    Post,
    | "id"
    | "title"
    | "slug"
    | "tags"
    | "excerpt"
    | "reading_time_minutes"
    | "published_at"
    | "created_at"
  >[];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Latest posts</h1>
        <p className="text-sm text-slate-600">
          Thoughts, updates, and ideas shared over time.
        </p>
      </div>
      {posts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-6 text-sm text-slate-600">
          No posts published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border border-slate-200 p-5"
            >
              <div className="space-y-2">
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-lg font-semibold text-slate-900"
                >
                  {post.title}
                </Link>
                <div className="text-xs text-slate-500">
                  {formatDate(post.published_at ?? post.created_at)}
                  {post.reading_time_minutes ? (
                    <span> · {post.reading_time_minutes} min read</span>
                  ) : null}
                </div>
                {post.excerpt ? (
                  <p className="text-sm text-slate-700">{post.excerpt}</p>
                ) : null}
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
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
