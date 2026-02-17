export function slugify(input: string) {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return normalized || "untitled";
}
