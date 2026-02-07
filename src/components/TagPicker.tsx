"use client";

import { useState } from "react";

export default function TagPicker({
  initialTags,
  name
}: {
  initialTags?: string[];
  name: string;
}) {
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [input, setInput] = useState("");

  const addTag = () => {
    const value = input.trim();
    if (!value) {
      return;
    }
    if (tags.includes(value)) {
      setInput("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={tags.join(", ")} />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
          >
            {tag}
            <button
              className="text-slate-400 hover:text-slate-700"
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 ? (
          <span className="text-xs text-slate-400">No tags yet</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Add a tag"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
          type="button"
          onClick={addTag}
        >
          Add
        </button>
      </div>
    </div>
  );
}
