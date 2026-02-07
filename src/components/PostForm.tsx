import { savePost } from "@/app/admin/actions";
import type { Post } from "@/lib/posts";
import CoverImageUploader from "@/components/CoverImageUploader";
import TagPicker from "@/components/TagPicker";

export default function PostForm({
  post,
  heading
}: {
  post?: Post | null;
  heading: string;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{heading}</h1>
        <p className="text-sm text-slate-600">
          Drafts stay private. Publish when you are ready to share.
        </p>
      </div>
      <form action={savePost} className="space-y-5">
        <input type="hidden" name="postId" value={post?.id ?? ""} />
        <input type="hidden" name="currentSlug" value={post?.slug ?? ""} />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">Title</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="title"
            defaultValue={post?.title ?? ""}
            placeholder="New blog post"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">Tags</span>
          <TagPicker name="tags" initialTags={post?.tags ?? []} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">Cover image</span>
          <CoverImageUploader
            name="coverImageUrl"
            initialUrl={post?.cover_image_url ?? ""}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">
            Excerpt (optional)
          </span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt ?? ""}
            placeholder="Short summary for the list view"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">SEO title</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="metaTitle"
            defaultValue={post?.meta_title ?? ""}
            placeholder="Override the page title (optional)"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">
            SEO description
          </span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="metaDescription"
            rows={2}
            defaultValue={post?.meta_description ?? ""}
            placeholder="Meta description for search results"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">
            Content (Markdown)
          </span>
          <textarea
            className="min-h-[320px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="content"
            defaultValue={post?.content ?? ""}
            placeholder="Write your post in Markdown"
            required
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
            type="submit"
            name="intent"
            value="draft"
          >
            Save draft
          </button>
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            type="submit"
            name="intent"
            value="publish"
          >
            Publish
          </button>
        </div>
      </form>
    </section>
  );
}
