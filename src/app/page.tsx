import Link from "next/link";

import { recordImpression } from "../lib/analytics";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { resolveSiteContext } from "../lib/sites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { site, domain } = await resolveSiteContext();

  if (!site) {
    return (
      <main className="page">
        <h1>Site not found</h1>
        <p>Unknown domain: {domain || "unknown"}.</p>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, published_at")
    .eq("site_id", site.id)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  await recordImpression({ siteId: site.id, path: "/" });

  return (
    <main className="page">
      <header>
        <h1>{site.name}</h1>
        <p className="text-secondary">Latest posts</p>
      </header>
      {error ? <p className="text-error">{error.message}</p> : null}
      {!posts?.length ? <p>No posts yet.</p> : null}
      <ul className="list-reset">
        {(posts ?? []).map((post) => (
          <li key={post.id} className="list-item">
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            {post.published_at ? (
              <p className="meta">
                {new Date(post.published_at).toLocaleDateString()}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <section className="section">
        <h2>Subscribe</h2>
        <p>Get new posts delivered by email.</p>
        <Link href="/subscribe">Subscribe to updates</Link>
      </section>
    </main>
  );
}
