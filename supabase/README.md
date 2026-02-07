# Supabase setup

1. Create a new Supabase project.
2. In the SQL editor, run the contents of `supabase/schema.sql`.
3. Enable email auth in Supabase Auth settings.
4. Create a public storage bucket named `post-covers`.
5. Add a storage policy that allows only the admin email to manage `post-covers`.
6. Add the values from the Supabase API settings into your environment.

## Storage policy (SQL)

Run this in the SQL editor to allow uploads from the admin email:

```sql
create policy "Admin uploads for post covers"
  on storage.objects for insert
  with check (
    bucket_id = 'post-covers'
    and (auth.jwt() ->> 'email') = 'rmoreno.cesar@gmail.com'
  );

create policy "Admin updates for post covers"
  on storage.objects for update
  using (
    bucket_id = 'post-covers'
    and (auth.jwt() ->> 'email') = 'rmoreno.cesar@gmail.com'
  );

create policy "Admin deletes for post covers"
  on storage.objects for delete
  using (
    bucket_id = 'post-covers'
    and (auth.jwt() ->> 'email') = 'rmoreno.cesar@gmail.com'
  );
```

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VIEWER_HASH_SALT`
