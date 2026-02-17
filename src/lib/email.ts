type EmailPreviewInput = {
  siteName: string;
  siteDomain: string;
  postTitle: string;
  postSlug: string;
  contentMd: string;
};

export function buildPostUrl(siteDomain: string, postSlug: string) {
  return `https://${siteDomain}/posts/${postSlug}`;
}

export function buildExcerpt(contentMd: string, maxLength = 160) {
  const withoutCodeBlocks = contentMd.replace(/```[\s\S]*?```/g, " ");
  const withoutInlineCode = withoutCodeBlocks.replace(/`[^`]*`/g, " ");
  const withoutImages = withoutInlineCode.replace(/!\[[^\]]*]\([^)]+\)/g, " ");
  const withoutLinks = withoutImages.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const withoutHeadings = withoutLinks.replace(/^#+\s+/gm, "");
  const withoutMarkers = withoutHeadings.replace(/[*_>~\-]+/g, " ");
  const cleaned = withoutMarkers.replace(/\s+/g, " ").trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3)}...`;
}

export function buildEmailSubject({
  siteName,
  postTitle,
}: Pick<EmailPreviewInput, "siteName" | "postTitle">) {
  return `${postTitle} | ${siteName}`;
}

export function buildEmailBody({
  siteName,
  siteDomain,
  postTitle,
  postSlug,
  contentMd,
}: EmailPreviewInput) {
  const excerpt = buildExcerpt(contentMd);
  const postUrl = buildPostUrl(siteDomain, postSlug);
  const unsubscribeUrl = `https://${siteDomain}/unsubscribe`;

  return [
    `${siteName} published a new post:`,
    "",
    postTitle,
    "",
    excerpt,
    "",
    `Read: ${postUrl}`,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}
