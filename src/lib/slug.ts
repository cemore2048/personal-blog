import slugify from "slugify";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function toSlug(value: string) {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true
  });
}

export async function ensureUniqueSlug({
  title,
  currentSlug
}: {
  title: string;
  currentSlug?: string | null;
}) {
  const base = toSlug(title) || "untitled";
  if (currentSlug && currentSlug === base) {
    return currentSlug;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) {
    return base;
  }

  const existing = new Set(data?.map((row) => row.slug));
  if (!existing.has(base)) {
    return base;
  }

  let suffix = 1;
  let candidate = `${base}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
