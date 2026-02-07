# Personal Blog

A minimal personal blogging platform built with Next.js and Supabase.

## Setup

1. Install dependencies: `npm install`
2. Copy environment variables into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `VIEWER_HASH_SALT`
3. Create the Supabase tables by running `supabase/schema.sql` in the Supabase SQL editor.
4. Start the dev server: `npm run dev`