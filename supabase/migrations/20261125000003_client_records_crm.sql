create table if not exists public.client_records (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid unique references public.enquiries(id) on delete set null,
  client_ref text not null unique default ('ASHU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  name text not null check (char_length(name) between 1 and 160),
  phone text not null check (char_length(phone) between 5 and 40),
  email text,
  practice_area text,
  status text not null default 'active' check (status in ('active','on_hold','completed','closed')),
  next_follow_up date,
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 3000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_records_follow_up_idx on public.client_records(next_follow_up) where next_follow_up is not null;
create index if not exists client_records_status_idx on public.client_records(status, updated_at desc);
alter table public.client_records enable row level security;
revoke all on public.client_records from anon, authenticated;
