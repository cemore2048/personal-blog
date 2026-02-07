export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  reading_time_minutes: number | null;
  meta_title: string | null;
  meta_description: string | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostViewSummary = {
  post_id: string;
  total_views: number;
  unique_views: number;
  last_viewed_at: string | null;
};
