import { NextResponse } from "next/server";

import { getSelectedSiteId, requireAdminSession } from "../../../../lib/admin";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

export async function GET() {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    return NextResponse.json({ error: "Missing site selection." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, status, created_at, unsubscribed_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ["email", "status", "created_at", "unsubscribed_at"].join(",");
  const rows = (subscribers ?? []).map((subscriber) =>
    [
      subscriber.email,
      subscriber.status,
      subscriber.created_at,
      subscriber.unsubscribed_at ?? "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  const content = [header, ...rows].join("\n");
  const filename = `subscribers-export-${siteId}.csv`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
