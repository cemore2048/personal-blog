import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!params.id) {
    return NextResponse.json({ error: "Missing post id" }, { status: 400 });
  }

  const headerStore = headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const salt = process.env.VIEWER_HASH_SALT ?? "local-dev";

  const viewerHash = crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}|${salt}`)
    .digest("hex");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("post_views").insert({
    post_id: params.id,
    viewer_hash: viewerHash
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
