import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import MarkdownRenderer from "../../../components/MarkdownRenderer";
import { recordImpression } from "../../../lib/analytics";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { resolveSiteContext } from "../../../lib/sites";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

function buildCanonical(domain: string, slug: string) {
  return `https://${domain}/posts/${slug}`;
}

function buildExcerpt(content: string) {
  const cleaned = content.replace(/\s+/g, " ").trim();
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

async function fetchPublishedPost(siteId: string, slug: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .from("posts")
    .select("id, title, slug, content_md, published_at")
    .eq("site_id", siteId)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .eq("slug", slug)
    .maybeSingle();
}

async function resolveRedirectSlug(siteId: string, slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: slugEntry } = await supabase
    .from("post_slugs")
    .select("post_id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .maybeSingle();

  if (!slugEntry) {
    return null;
  }

  const { data: post } = await supabase
    .from("posts")
    .select("slug, status, published_at")
    .eq("id", slugEntry.post_id)
    .eq("site_id", siteId)
    .maybeSingle();

  if (!post || post.status !== "published") {
    return null;
  }

  if (post.published_at && new Date(post.published_at) > new Date()) {
    return null;
  }

  return post.slug;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { site } = await resolveSiteContext();

  if (!site) {
    return {};
  }

  const { data: post } = await fetchPublishedPost(site.id, slug);

  if (!post) {
    return {};
  }

  const canonical = buildCanonical(site.domain, post.slug);

  return {
    title: post.title,
    description: buildExcerpt(post.content_md ?? ""),
    alternates: {
      canonical,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const { site } = await resolveSiteContext();

  if (!site) {
    notFound();
  }

  const { data: post } = await fetchPublishedPost(site.id, slug);

  if (!post) {
    const redirectSlug = await resolveRedirectSlug(site.id, slug);
    if (redirectSlug) {
      redirect(`/posts/${redirectSlug}`);
    }
    notFound();
  }

  await recordImpression({
    siteId: site.id,
    postId: post.id,
    path: `/posts/${post.slug}`,
  });

  return (
    <main className="page">
      <article>
        <h1>{post.title}</h1>
        {post.published_at ? (
          <p className="meta">
            {new Date(post.published_at).toLocaleDateString()}
          </p>
        ) : null}
        <MarkdownRenderer content={post.content_md ?? ""} />
      </article>
    </main>
  );
}
