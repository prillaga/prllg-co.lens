-- Run once in Supabase: SQL Editor → New query → paste → Run

create table if not exists public.prillaga_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.prillaga_store enable row level security;

-- No public policies: only the service role key (server API) can read/write.
