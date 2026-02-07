"use client";

import { useEffect } from "react";

export default function PostViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (!postId) {
      return;
    }

    const controller = new AbortController();
    fetch(`/api/posts/${postId}/view`, {
      method: "POST",
      signal: controller.signal,
      keepalive: true
    }).catch(() => {
      // Best-effort tracking.
    });

    return () => controller.abort();
  }, [postId]);

  return null;
}
