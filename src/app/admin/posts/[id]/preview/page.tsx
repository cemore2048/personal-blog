import Link from "next/link";

import MarkdownRenderer from "../../../../../components/MarkdownRenderer";
import { recordImpression } from "../../../../../lib/analytics";
import { getSelectedSiteId, requireAdminSession } from "../../../../../lib/admin";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";

type AdminPostPreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPostPreviewPage({
  params,
}: AdminPostPreviewPageProps) {
  const { id } = await params;
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    return (
      <main className="page">
        <p>Select a site first.</p>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, slug, content_md, updated_at")
    .eq("id", id)
    .eq("site_id", siteId)
    .maybeSingle();

  if (error || !post) {
    return (
      <main className="page">
        <p>Draft not found.</p>
        <Link href="/admin/posts">Back to drafts</Link>
      </main>
    );
  }

  await recordImpression({
    siteId,
    postId: post.id,
    path: `/admin/posts/${post.id}/preview`,
    isPreview: true,
  });

  return (
    <main className="page">
      <Link href={`/admin/posts/${post.id}`}>Back to editor</Link>
      <h1>{post.title}</h1>
      <p className="meta">
        Preview updated {new Date(post.updated_at).toLocaleString()}
      </p>
      <MarkdownRenderer content={post.content_md ?? ""} />
    </main>
  );
}
