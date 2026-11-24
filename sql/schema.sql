-- Supabase starter schema. Review with a security professional before production.
create table if not exists public.articles (id uuid primary key default gen_random_uuid(), slug text not null unique, language text not null check(language in ('en','hi')), title text not null, category text not null, summary text, body_md text not null default '', status text not null default 'draft' check(status in ('draft','review','approved','published','archived')), source_urls text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), approved_by uuid, approved_at timestamptz, published_at timestamptz);
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, role text not null default 'editor' check(role in ('owner','advocate','editor')), created_at timestamptz not null default now());
create table if not exists public.enquiries (id uuid primary key default gen_random_uuid(), name text not null, phone text not null, email text, category text, message text not null, consent_at timestamptz not null, created_at timestamptz not null default now());
create table if not exists public.newsletter_subscribers (id uuid primary key default gen_random_uuid(), email text not null unique, consent_at timestamptz not null, unsubscribed_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.push_subscriptions (id uuid primary key default gen_random_uuid(), endpoint text not null unique, subscription jsonb not null, consent_at timestamptz not null, revoked_at timestamptz, created_at timestamptz not null default now());
-- Enable RLS. Add narrowly scoped policies only after role design is final.
alter table public.articles enable row level security;
alter table public.profiles enable row level security;
alter table public.enquiries enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.push_subscriptions enable row level security;
-- Intentionally no permissive policies are supplied. Public reads should expose published articles only via a reviewed view/API.
