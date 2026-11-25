-- Ashu Website production foundation. Review and run in a new Supabase project before enabling any feature.
-- Uses private schemas for server-only rate limiting; service keys must remain server-side.
create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated, service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null check (role in ('owner','advocate','editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "staff can read own profile" on public.profiles;
create policy "staff can read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
grant select on public.profiles to authenticated;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  language text not null check (language in ('en','hi')),
  title text not null check (char_length(title) between 3 and 180),
  category text not null,
  summary text,
  body_md text not null default '',
  seo_title text,
  seo_description text,
  source_urls text[] not null default '{}',
  verification_notes text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','review','approved','published','archived')),
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language),
  check (status <> 'published' or (approved_by is not null and approved_at is not null and published_at is not null))
);
alter table public.articles enable row level security;
create index if not exists articles_publication_idx on public.articles(language, published_at desc) where status = 'published';
create index if not exists articles_schedule_idx on public.articles(scheduled_for) where status = 'approved';
drop policy if exists "public can read published articles" on public.articles;
create policy "public can read published articles" on public.articles for select to anon, authenticated
  using (status = 'published');
drop policy if exists "staff can read all articles" on public.articles;
create policy "staff can read all articles" on public.articles for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid())));
drop policy if exists "staff can create drafts" on public.articles;
create policy "staff can create drafts" on public.articles for insert to authenticated
  with check (
    created_by = (select auth.uid()) and status in ('draft','review') and
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('owner','advocate','editor'))
  );
drop policy if exists "staff can edit articles" on public.articles;
create policy "staff can edit articles" on public.articles for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('owner','advocate','editor')))
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and
      (p.role in ('owner','advocate') or status in ('draft','review')))
    and (status <> 'approved' or (approved_by is not null and approved_at is not null and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('owner','advocate'))))
    and (status <> 'published' or (
      approved_by is not null and approved_at is not null and published_at is not null and
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('owner','advocate'))
    ))
  );

grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated, service_role;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  category text,
  message text not null,
  consent_at timestamptz not null,
  retention_until timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;
create index if not exists enquiries_retention_idx on public.enquiries(retention_until);
grant all on public.enquiries to service_role;
revoke all on public.enquiries from anon, authenticated;
-- No anon/authenticated policies. Public submissions go through a validated server endpoint.
-- Enquiry access is server-only through the role-checked owner/advocate API endpoint.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_at timestamptz not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
grant all on public.newsletter_subscribers to service_role;
revoke all on public.newsletter_subscribers from anon, authenticated;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  subscription jsonb not null,
  consent_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
grant all on public.push_subscriptions to service_role;
revoke all on public.push_subscriptions from anon, authenticated;

create table if not exists public.blog_generation_runs (
  run_date date primary key,
  status text not null check (status in ('running','completed','failed')),
  article_ids uuid[] not null default '{}',
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.blog_generation_runs enable row level security;
grant all on public.blog_generation_runs to service_role;
revoke all on public.blog_generation_runs from anon, authenticated;

-- Server-only, hashed-key rate limiter. Function is outside exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.api_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);
revoke all on private.api_rate_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant all on private.api_rate_limits to service_role;

create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  current_window timestamptz := date_trunc('second', clock_timestamp());
  allowed boolean;
begin
  if p_key is null or length(p_key) <> 64 or p_limit < 1 or p_limit > 1000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;
  insert into private.api_rate_limits(key_hash, window_started_at, request_count)
  values (p_key, current_window, 1)
  on conflict (key_hash) do update set
    request_count = case
      when private.api_rate_limits.window_started_at <= current_window - make_interval(secs => p_window_seconds) then 1
      else private.api_rate_limits.request_count + 1
    end,
    window_started_at = case
      when private.api_rate_limits.window_started_at <= current_window - make_interval(secs => p_window_seconds) then current_window
      else private.api_rate_limits.window_started_at
    end,
    updated_at = current_window;
  select request_count <= p_limit into allowed from private.api_rate_limits where key_hash = p_key;
  return coalesce(allowed, false);
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- First administrator accounts must be created/invited in Supabase Auth.
-- Then insert their exact auth user IDs here with the intended role.
-- Do not grant roles based on user-editable user_metadata.
