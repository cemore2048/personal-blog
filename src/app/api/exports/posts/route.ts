import { NextResponse } from "next/server";

import { getSelectedSiteId, requireAdminSession } from "../../../../lib/admin";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

function buildFrontmatter(post: {
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}) {
  return [
    "---",
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `slug: "${post.slug}"`,
    `status: "${post.status}"`,
    `published_at: "${post.published_at ?? ""}"`,
    `created_at: "${post.created_at}"`,
    `updated_at: "${post.updated_at}"`,
    "---",
  ].join("\n");
}

export async function GET() {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    return NextResponse.json({ error: "Missing site selection." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, content_md, status, published_at, created_at, updated_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const content = (posts ?? [])
    .map((post) => {
      const frontmatter = buildFrontmatter(post);
      const body = post.content_md ?? "";
      return [frontmatter, "", body, "", "---"].join("\n");
    })
    .join("\n");

  const filename = `posts-export-${siteId}.md`;
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
