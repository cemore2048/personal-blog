import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { buildEmailBody, buildEmailSubject } from "../../../../lib/email";

type OutboxRow = {
  id: string;
  to_email: string;
  status: string;
  posts: {
    id: string;
    title: string;
    slug: string;
    content_md: string | null;
    notify_on_publish: boolean;
    status: string;
    published_at: string | null;
    site_id: string;
  } | null;
  sites: {
    id: string;
    name: string;
    domain: string;
    email_enabled: boolean;
    email_from: string | null;
    email_sender_name: string | null;
  } | null;
  subscribers: {
    id: string;
    status: string;
  } | null;
};

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  const { data: outbox, error } = await supabase
    .from("email_outbox")
    .select(
      `
      id,
      to_email,
      status,
      posts:post_id (id, title, slug, content_md, notify_on_publish, status, published_at, site_id),
      sites:site_id (id, name, domain, email_enabled, email_from, email_sender_name),
      subscribers:subscriber_id (id, status)
    `
    )
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);
  let sentCount = 0;
  let failedCount = 0;

  for (const entry of (outbox ?? []) as unknown as OutboxRow[]) {
    const post = entry.posts;
    const site = entry.sites;
    const subscriber = entry.subscribers;

    if (!post || !site || !subscriber) {
      await supabase
        .from("email_outbox")
        .update({ status: "failed", last_error: "Invalid send context." })
        .eq("id", entry.id);
      failedCount += 1;
      continue;
    }

    if (subscriber.status !== "active" || !post.notify_on_publish) {
      await supabase
        .from("email_outbox")
        .update({ status: "failed", last_error: "Notification disabled." })
        .eq("id", entry.id);
      failedCount += 1;
      continue;
    }

    if (!site.email_enabled || !site.email_from || post.status !== "published") {
      continue;
    }

    if (post.published_at && new Date(post.published_at) > new Date()) {
      continue;
    }

    const fromAddress = site.email_sender_name
      ? `${site.email_sender_name} <${site.email_from}>`
      : site.email_from;

    const subject = buildEmailSubject({
      siteName: site.name,
      postTitle: post.title,
    });

    const text = buildEmailBody({
      siteName: site.name,
      siteDomain: site.domain,
      postTitle: post.title,
      postSlug: post.slug,
      contentMd: post.content_md ?? "",
    });

    try {
      await resend.emails.send({
        from: fromAddress,
        to: entry.to_email,
        subject,
        text,
      });

      await supabase
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", entry.id);

      sentCount += 1;
    } catch (sendError) {
      await supabase
        .from("email_outbox")
        .update({
          status: "failed",
          last_error: sendError instanceof Error ? sendError.message : "Send failed.",
        })
        .eq("id", entry.id);

      failedCount += 1;
    }
  }

  return NextResponse.json({
    sent: sentCount,
    failed: failedCount,
    processed: outbox?.length ?? 0,
  });
}
