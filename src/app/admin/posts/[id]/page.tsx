import Link from "next/link";

import { getSelectedSiteId, requireAdminSession } from "../../../../lib/admin";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import AutoSendPendingEmails from "../../../../components/AutoSendPendingEmails";
import DraftEditorForm from "../../../../components/DraftEditorForm";
import PublishSettingsDrawer from "../../../../components/PublishSettingsDrawer";
import { publishPostAction, updateDraftAction } from "./actions";
import { buildEmailBody, buildEmailSubject } from "../../../../lib/email";

type AdminPostEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: {
    error?: string;
    send?: string;
  };
};

export default async function AdminPostEditPage({
  params,
  searchParams,
}: AdminPostEditPageProps) {
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
    .select(
      "id, title, slug, content_md, status, published_at, notify_on_publish, created_at, updated_at"
    )
    .eq("id", id)
    .eq("site_id", siteId)
    .maybeSingle();

  const { data: site } = await supabase
    .from("sites")
    .select("id, name, domain, email_enabled, email_from, email_sender_name")
    .eq("id", siteId)
    .maybeSingle();

  if (error || !post) {
    return (
      <main className="page">
        <p>Draft not found.</p>
        <Link href="/admin/posts">Back to drafts</Link>
      </main>
    );
  }

  const shouldSendEmails = searchParams?.send === "1";
  const previewSubject = site
    ? buildEmailSubject({
        siteName: site.name,
        postTitle: post.title,
      })
    : "";
  const previewBody = site
    ? buildEmailBody({
        siteName: site.name,
        siteDomain: site.domain,
        postTitle: post.title,
        postSlug: post.slug,
        contentMd: post.content_md ?? "",
      })
    : "";

  return (
    <main className="page page--xwide">
      <div className="inline-actions">
        <Link href="/admin/posts">Back to drafts</Link>
        <Link href={`/admin/posts/${post.id}/preview`}>Preview</Link>
      </div>
      <h1>Edit draft</h1>
      <DraftEditorForm
        postId={post.id}
        title={post.title}
        slug={post.slug}
        contentMd={post.content_md ?? ""}
        updatedAt={post.updated_at}
        errorMessage={searchParams?.error}
        action={updateDraftAction}
      />
      <PublishSettingsDrawer
        postId={post.id}
        status={post.status}
        publishedAt={post.published_at}
        notifyOnPublish={post.notify_on_publish}
        emailEnabled={site?.email_enabled ?? null}
        shouldSendEmails={shouldSendEmails}
        action={publishPostAction}
      >
        <AutoSendPendingEmails shouldSend={shouldSendEmails} />
      </PublishSettingsDrawer>
      <section className="section">
        <h2>Email preview</h2>
        {site ? (
          <>
            <p className="text-secondary">
              This is the text sent when "Publish and notify" is used.
            </p>
            <p>
              <strong>Subject:</strong> {previewSubject}
            </p>
            <pre className="preformatted">
              {previewBody}
            </pre>
          </>
        ) : (
          <p>Site settings not found.</p>
        )}
      </section>
    </main>
  );
}
