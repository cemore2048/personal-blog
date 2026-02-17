"use client";

import { useMemo, useState } from "react";
import RichMarkdownEditor from "./RichMarkdownEditor";

type DraftEditorFormProps = {
  postId: string;
  title: string;
  slug: string;
  contentMd: string;
  updatedAt: string;
  errorMessage?: string;
  action: (formData: FormData) => void;
};

export default function DraftEditorForm({
  postId,
  title,
  slug,
  contentMd,
  updatedAt,
  errorMessage,
  action,
}: DraftEditorFormProps) {
  const [markdown, setMarkdown] = useState(contentMd ?? "");

  const updatedLabel = useMemo(() => {
    if (!updatedAt) {
      return "";
    }
    return new Date(updatedAt).toLocaleString();
  }, [updatedAt]);

  return (
    <form action={action} className="form">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="contentMd" value={markdown} />
      {errorMessage ? (
        <p className="text-error">{errorMessage}</p>
      ) : null}
      <label className="form-field">
        Title
        <input
          type="text"
          name="title"
          defaultValue={title}
          required
        />
      </label>
      <label className="form-field">
        Slug
        <input
          type="text"
          name="slug"
          defaultValue={slug}
          required
        />
      </label>
      <p className="meta">Updated: {updatedLabel}</p>
      <section className="section">
        <h2>Content</h2>
        <RichMarkdownEditor
          initialMarkdown={markdown}
          onMarkdownChange={setMarkdown}
        />
      </section>
      <button
        type="submit"
        className="button button-primary"
      >
        Save changes
      </button>
    </form>
  );
}
