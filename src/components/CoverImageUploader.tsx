"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CoverImageUploader({
  initialUrl,
  name
}: {
  initialUrl?: string | null;
  name: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `covers/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("post-covers")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type
      });

    if (error) {
      setMessage(error.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("post-covers").getPublicUrl(path);
    setUrl(data.publicUrl);
    setIsUploading(false);
    setMessage("Cover image uploaded.");
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />
      {url ? (
        <img
          src={url}
          alt="Cover preview"
          className="max-h-64 w-full rounded-lg object-cover"
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="text-sm"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {url ? (
          <button
            className="rounded-md border border-slate-300 px-3 py-1 text-sm"
            type="button"
            onClick={() => setUrl("")}
          >
            Remove image
          </button>
        ) : null}
      </div>
      {isUploading ? (
        <p className="text-xs text-slate-500">Uploading...</p>
      ) : null}
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
