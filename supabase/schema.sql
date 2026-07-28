create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  email_enabled boolean not null default false,
  email_from text,
  email_sender_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  title text not null,
  slug text not null,
  content_md text not null default '',
  status text not null default 'draft',
  published_at timestamp with time zone,
  notify_on_publish boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists posts_site_slug_unique on public.posts (site_id, slug);

create table if not exists public.post_slugs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text not null,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists post_slugs_site_slug_unique
  on public.post_slugs (site_id, slug);

create index if not exists post_slugs_post_id_idx on public.post_slugs (post_id);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  email text not null,
  status text not null default 'active',
  created_at timestamp with time zone not null default now(),
  unsubscribed_at timestamp with time zone
);

create unique index if not exists subscribers_site_email_unique
  on public.subscribers (site_id, email);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  to_email text not null,
  status text not null default 'pending',
  last_error text,
  created_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone
);

create unique index if not exists email_outbox_post_subscriber_unique
  on public.email_outbox (post_id, subscriber_id);

create index if not exists email_outbox_site_id_idx on public.email_outbox (site_id);
create index if not exists email_outbox_subscriber_id_idx on public.email_outbox (subscriber_id);

create table if not exists public.impressions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  path text not null,
  user_agent text,
  is_preview boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create index if not exists impressions_site_created_at_index
  on public.impressions (site_id, created_at desc);

create index if not exists impressions_post_created_at_index
  on public.impressions (post_id, created_at desc);

alter table if exists public.posts
  add column if not exists site_id uuid references public.sites(id) on delete cascade;

alter table if exists public.post_slugs
  add column if not exists site_id uuid references public.sites(id) on delete cascade;

alter table if exists public.subscribers
  add column if not exists site_id uuid references public.sites(id) on delete cascade;

alter table if exists public.email_outbox
  add column if not exists site_id uuid references public.sites(id) on delete cascade;

alter table if exists public.impressions
  add column if not exists site_id uuid references public.sites(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscribers_status_check'
  ) then
    alter table public.subscribers
      add constraint subscribers_status_check
      check (status in ('active', 'unsubscribed'));
  end if;
end;
$$;

alter table if exists public.sites
  add column if not exists email_enabled boolean not null default false;

alter table if exists public.sites
  add column if not exists email_from text;

alter table if exists public.sites
  add column if not exists email_sender_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_outbox_status_check'
  ) then
    alter table public.email_outbox
      add constraint email_outbox_status_check
      check (status in ('pending', 'sent', 'failed'));
  end if;
end;
$$;

alter table if exists public.posts
  add column if not exists status text not null default 'draft';

alter table if exists public.posts
  add column if not exists published_at timestamp with time zone;

alter table if exists public.posts
  add column if not exists notify_on_publish boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_status_check'
  ) then
    alter table public.posts
      add constraint posts_status_check
      check (status in ('draft', 'scheduled', 'published'));
  end if;
end;
$$;

create or replace function public.enqueue_post_emails(post_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.email_outbox (site_id, post_id, subscriber_id, to_email)
  select posts.site_id,
         posts.id,
         subscribers.id,
         subscribers.email
  from public.posts
  join public.subscribers
    on subscribers.site_id = posts.site_id
  join public.sites
    on sites.id = posts.site_id
  where posts.id = enqueue_post_emails.post_id
    and posts.status = 'published'
    and posts.notify_on_publish = true
    and subscribers.status = 'active'
    and sites.email_enabled = true
  on conflict (post_id, subscriber_id) do nothing;
end;
$$;

create or replace function public.publish_scheduled_posts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with published as (
    update public.posts
    set status = 'published',
        updated_at = now()
    where status = 'scheduled'
      and published_at is not null
      and published_at <= now()
    returning id
  )
  select public.enqueue_post_emails(published.id) from published;
end;
$$;

create or replace function public.subscribe_to_site(p_site_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(p_email));
begin
  if p_site_id is null or normalized is null or normalized = '' or position('@' in normalized) = 0 then
    raise exception 'Invalid subscribe request';
  end if;

  if not exists (select 1 from public.sites where id = p_site_id) then
    raise exception 'Site not found';
  end if;

  insert into public.subscribers (site_id, email, status, unsubscribed_at)
  values (p_site_id, normalized, 'active', null)
  on conflict (site_id, email) do update
    set status = 'active',
        unsubscribed_at = null;
end;
$$;

create or replace function public.unsubscribe_from_site(p_site_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(p_email));
begin
  if p_site_id is null or normalized is null or normalized = '' or position('@' in normalized) = 0 then
    raise exception 'Invalid unsubscribe request';
  end if;

  if not exists (select 1 from public.sites where id = p_site_id) then
    raise exception 'Site not found';
  end if;

  insert into public.subscribers (site_id, email, status, unsubscribed_at)
  values (p_site_id, normalized, 'unsubscribed', now())
  on conflict (site_id, email) do update
    set status = 'unsubscribed',
        unsubscribed_at = now();
end;
$$;

revoke all on function public.enqueue_post_emails(uuid) from public;
revoke all on function public.enqueue_post_emails(uuid) from anon;
grant execute on function public.enqueue_post_emails(uuid) to authenticated;
grant execute on function public.enqueue_post_emails(uuid) to service_role;

revoke all on function public.publish_scheduled_posts() from public;
revoke all on function public.publish_scheduled_posts() from anon;
revoke all on function public.publish_scheduled_posts() from authenticated;
grant execute on function public.publish_scheduled_posts() to postgres;
grant execute on function public.publish_scheduled_posts() to service_role;

revoke all on function public.subscribe_to_site(uuid, text) from public;
grant execute on function public.subscribe_to_site(uuid, text) to anon, authenticated, service_role;

revoke all on function public.unsubscribe_from_site(uuid, text) from public;
grant execute on function public.unsubscribe_from_site(uuid, text) to anon, authenticated, service_role;

alter table public.sites enable row level security;
alter table public.posts enable row level security;
alter table public.post_slugs enable row level security;
alter table public.subscribers enable row level security;
alter table public.email_outbox enable row level security;
alter table public.impressions enable row level security;

-- sites: public read (domain resolution); authenticated write
drop policy if exists sites_select_public on public.sites;
create policy sites_select_public
  on public.sites for select
  to anon, authenticated
  using (true);

drop policy if exists sites_insert_authenticated on public.sites;
create policy sites_insert_authenticated
  on public.sites for insert
  to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists sites_update_authenticated on public.sites;
create policy sites_update_authenticated
  on public.sites for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists sites_delete_authenticated on public.sites;
create policy sites_delete_authenticated
  on public.sites for delete
  to authenticated
  using ((select auth.uid()) is not null);

-- posts: anon only published; authenticated full access
drop policy if exists posts_select_published on public.posts;
create policy posts_select_published
  on public.posts for select
  to anon
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists posts_select_authenticated on public.posts;
create policy posts_select_authenticated
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists posts_insert_authenticated on public.posts;
create policy posts_insert_authenticated
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists posts_update_authenticated on public.posts;
create policy posts_update_authenticated
  on public.posts for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists posts_delete_authenticated on public.posts;
create policy posts_delete_authenticated
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) is not null);

-- post_slugs: public read; authenticated write
drop policy if exists post_slugs_select_public on public.post_slugs;
create policy post_slugs_select_public
  on public.post_slugs for select
  to anon, authenticated
  using (true);

drop policy if exists post_slugs_insert_authenticated on public.post_slugs;
create policy post_slugs_insert_authenticated
  on public.post_slugs for insert
  to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists post_slugs_update_authenticated on public.post_slugs;
create policy post_slugs_update_authenticated
  on public.post_slugs for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists post_slugs_delete_authenticated on public.post_slugs;
create policy post_slugs_delete_authenticated
  on public.post_slugs for delete
  to authenticated
  using ((select auth.uid()) is not null);

-- subscribers: no public table access (use RPCs); authenticated manage
drop policy if exists subscribers_select_authenticated on public.subscribers;
create policy subscribers_select_authenticated
  on public.subscribers for select
  to authenticated
  using (true);

drop policy if exists subscribers_insert_authenticated on public.subscribers;
create policy subscribers_insert_authenticated
  on public.subscribers for insert
  to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists subscribers_update_authenticated on public.subscribers;
create policy subscribers_update_authenticated
  on public.subscribers for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists subscribers_delete_authenticated on public.subscribers;
create policy subscribers_delete_authenticated
  on public.subscribers for delete
  to authenticated
  using ((select auth.uid()) is not null);

-- email_outbox: authenticated only
drop policy if exists email_outbox_select_authenticated on public.email_outbox;
create policy email_outbox_select_authenticated
  on public.email_outbox for select
  to authenticated
  using (true);

drop policy if exists email_outbox_insert_authenticated on public.email_outbox;
create policy email_outbox_insert_authenticated
  on public.email_outbox for insert
  to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists email_outbox_update_authenticated on public.email_outbox;
create policy email_outbox_update_authenticated
  on public.email_outbox for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists email_outbox_delete_authenticated on public.email_outbox;
create policy email_outbox_delete_authenticated
  on public.email_outbox for delete
  to authenticated
  using ((select auth.uid()) is not null);

-- impressions: public insert for analytics; authenticated read
drop policy if exists impressions_insert_public on public.impressions;
create policy impressions_insert_public
  on public.impressions for insert
  to anon, authenticated
  with check (true);

drop policy if exists impressions_select_authenticated on public.impressions;
create policy impressions_select_authenticated
  on public.impressions for select
  to authenticated
  using (true);

drop policy if exists impressions_delete_authenticated on public.impressions;
create policy impressions_delete_authenticated
  on public.impressions for delete
  to authenticated
  using ((select auth.uid()) is not null);

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'publish-scheduled-posts'
  ) then
    perform cron.schedule(
      'publish-scheduled-posts',
      '* * * * *',
      'select public.publish_scheduled_posts();'
    );
  end if;
end;
$$;
