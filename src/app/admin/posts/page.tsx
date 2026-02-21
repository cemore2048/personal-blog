import Link from "next/link";

import { requireAdminSession, getSelectedSiteId } from "../../../lib/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { buildExcerpt } from "../../../lib/email";
import { deleteDraftAction } from "./actions";

type AdminPostsPageProps = {
  searchParams?: {
    error?: string;
  };
};

function IconEye() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();
  const errorMessage = searchParams?.error;

  if (!siteId) {
    return (
      <main className="page admin-page">
        <p>Select a site first.</p>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, status, content_md, published_at, created_at, updated_at")
    .eq("site_id", siteId)
    .order("updated_at", { ascending: false });

  return (
    <main className="page admin-page admin-posts-page">
      <header className="admin-posts-header">
        <h1>All Posts</h1>
        <p className="text-secondary">Manage your blog posts</p>
      </header>
      {errorMessage ? <p className="text-error">{errorMessage}</p> : null}
      {error ? <p className="text-error">{error.message}</p> : null}
      <ul className="admin-posts-list">
        {(posts ?? []).map((post) => {
          const description = buildExcerpt(post.content_md ?? "", 140);
          const isPublished = post.status === "published";

          return (
            <li key={post.id} className="admin-post-card">
              <div className="admin-post-card-content">
                <div className="admin-post-card-header">
                  <h3 className="admin-post-card-title">{post.title}</h3>
                  <span
                    className={`admin-post-status admin-post-status--${post.status}`}
                  >
                    {isPublished ? <IconEye /> : <IconDocument />}
                    {post.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                {description ? (
                  <p className="admin-post-card-description">{description}</p>
                ) : null}
                <p className="admin-post-card-meta">
                  Updated {new Date(post.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="admin-post-card-actions">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="admin-post-action admin-post-action--edit"
                  title="Edit"
                >
                  <IconPencil />
                </Link>
                <form action={deleteDraftAction} className="admin-post-delete-form">
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className="admin-post-action admin-post-action--delete"
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
      {!posts?.length && !error ? (
        <p className="text-secondary">No posts yet. Create one with New Post.</p>
      ) : null}
    </main>
  );
}
