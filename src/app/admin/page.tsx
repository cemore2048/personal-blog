import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import type { Post, PostViewSummary } from "@/lib/posts";

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminUser();

  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, title, slug, status, tags, reading_time_minutes, created_at, updated_at, published_at"
    )
    .order("updated_at", { ascending: false });

  const { data: viewData } = await supabase
    .from("post_view_counts")
    .select("post_id, total_views, unique_views, last_viewed_at");

  const viewMap = new Map<string, PostViewSummary>();
  (viewData ?? []).forEach((summary) => {
    viewMap.set(summary.post_id, summary as PostViewSummary);
  });

  const posts = (postsData ?? []) as Pick<
    Post,
    | "id"
    | "title"
    | "slug"
    | "status"
    | "tags"
    | "reading_time_minutes"
    | "created_at"
    | "updated_at"
    | "published_at"
  >[];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Drafts, published posts, and view metrics.
          </p>
        </div>
        <Link
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          href="/admin/new"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-6 text-sm text-slate-600">
          No posts yet. Create your first draft.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const metrics = viewMap.get(post.id);
            return (
              <article
                key={post.id}
                className="rounded-lg border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {post.title}
                    </h2>
                    <div className="text-xs uppercase text-slate-500">
                      {post.status === "published" ? "Published" : "Draft"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Updated {formatDate(post.updated_at)}
                    </div>
                    {post.published_at ? (
                      <div className="text-xs text-slate-500">
                        Published {formatDate(post.published_at)}
                      </div>
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
                  <div className="space-y-2 text-sm text-slate-600">
                    <div>Total views: {metrics?.total_views ?? 0}</div>
                    <div>Unique viewers: {metrics?.unique_views ?? 0}</div>
                    <div>
                      Reading time: {post.reading_time_minutes ?? 0} min
                    </div>
                    <div>
                      Last viewed: {formatDate(metrics?.last_viewed_at ?? null) ||
                        "-"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link className="text-blue-600" href={`/admin/${post.id}/edit`}>
                    Edit
                  </Link>
                  {post.status === "published" ? (
                    <Link className="text-blue-600" href={`/posts/${post.slug}`}>
                      View live
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
