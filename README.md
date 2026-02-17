# Personal Blog

A minimal personal blogging platform built with Next.js and Supabase.

## Setup

1. Install dependencies: `npm install`
2. Add environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `SITE_DOMAIN_OVERRIDE` (optional, for localhost)
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Start the dev server: `npm run dev`

## Export & Restore

- Export posts as Markdown from `Admin → Exports` (single `.md` file with frontmatter).
- Export subscribers as CSV from `Admin → Exports`.
- Restore posts by importing the Markdown entries into the `posts` table
  (`content_md`, `title`, `slug`, `status`, `published_at`).
- Restore subscribers by importing CSV rows into `subscribers`
  (`email`, `status`, `created_at`, `unsubscribed_at`).