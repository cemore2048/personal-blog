import { headers } from "next/headers";

import { createServerSupabaseClient } from "./supabase/server";

const botPattern =
  /(bot|crawler|spider|crawling|slurp|facebookexternalhit|discordbot|embedly|quora link preview|whatsapp|telegrambot|slackbot|twitterbot|linkedinbot|bingbot|googlebot|yandex)/i;

type RecordImpressionInput = {
  siteId: string;
  postId?: string | null;
  path: string;
  isPreview?: boolean;
};

export async function recordImpression({
  siteId,
  postId,
  path,
  isPreview = false,
}: RecordImpressionInput) {
  if (!siteId || !path) {
    return;
  }

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";

  if (!userAgent || botPattern.test(userAgent)) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("impressions").insert({
    site_id: siteId,
    post_id: postId ?? null,
    path,
    user_agent: userAgent,
    is_preview: isPreview,
  });
}
