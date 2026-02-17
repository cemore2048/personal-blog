import Link from "next/link";

import { requireAdminSession, getSelectedSiteId } from "../../../lib/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { createDraftAction, deleteDraftAction } from "./actions";

type AdminPostsPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();
  const errorMessage = searchParams?.error;

  if (!siteId) {
    return (
    <main className="page">
        <p>Select a site first.</p>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, status, published_at, created_at, updated_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  return (
    <main className="page page--wide">
      <h1>Drafts</h1>
      <p className="text-secondary">Drafts are scoped to the selected site.</p>
      {errorMessage ? <p className="text-error">{errorMessage}</p> : null}
      {error ? <p className="text-error">{error.message}</p> : null}
      <section className="section">
        <h2>Create a draft</h2>
        <form action={createDraftAction} className="form">
          <label className="form-field">
            Title
            <input
              type="text"
              name="title"
              required
            />
          </label>
          <label className="form-field">
            Slug (optional)
            <input
              type="text"
              name="slug"
              placeholder="auto-derived from title"
            />
          </label>
          <button type="submit" className="button button-primary">
            Create draft
          </button>
        </form>
      </section>
      <section className="section">
        <h2>Draft list</h2>
        {!posts?.length ? <p>No drafts yet.</p> : null}
        <ul className="list-reset">
          {(posts ?? []).map((post) => (
            <li
              key={post.id}
              className="card card--spaced"
            >
              <p className="no-margin">
                <strong>{post.title}</strong>
              </p>
              <p className="meta">
                Slug: <code>{post.slug}</code>
              </p>
              <p className="meta">
                Status: <strong>{post.status}</strong>
              </p>
              {post.published_at ? (
                <p className="meta">
                  Publish at: {new Date(post.published_at).toLocaleString()}
                </p>
              ) : null}
              <p className="meta">
                Updated: {new Date(post.updated_at).toLocaleString()}
              </p>
              <div className="inline-actions">
                <Link href={`/admin/posts/${post.id}`}>Edit</Link>
                <form action={deleteDraftAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className="button-link button-danger"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
