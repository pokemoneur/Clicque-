-- CLICQUE backend: one generic document table + realtime + basic rules.
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists public.docs (
  path   text primary key,                       -- e.g. rooms/ABCDE/chat/xyz
  parent text not null,                          -- e.g. rooms/ABCDE/chat
  id     text not null,
  data   jsonb not null,
  owner  uuid default auth.uid(),
  ts     bigint not null default (extract(epoch from now()) * 1000)::bigint,
  constraint docs_size check (pg_column_size(data) < 65536)
);
create index if not exists docs_parent_idx on public.docs (parent);
create index if not exists docs_ts_idx on public.docs (ts);

alter table public.docs replica identity full;   -- realtime DELETE events need the full old row
alter publication supabase_realtime add table public.docs;

alter table public.docs enable row level security;

-- Anyone signed in (anonymous sign-in counts) can read.
create policy "docs read" on public.docs for select to authenticated using (true);
-- Create: only inside the game's own collections.
create policy "docs insert" on public.docs for insert to authenticated
  with check (parent like 'rooms%' or parent = 'reports');
-- Update/delete: the document's creator, or the host of the room (rooms/<code>/... paths owned by host).
create policy "docs update own" on public.docs for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
create policy "docs delete own" on public.docs for delete to authenticated
  using (owner = auth.uid());

-- Housekeeping: remove rooms older than a day (schedule it from Database > Cron, or run by hand).
create or replace function public.cleanup_old_rooms() returns void language sql security definer as $$
  delete from public.docs where path like 'rooms/%' and ts < (extract(epoch from now()) * 1000)::bigint - 86400000;
$$;
-- select cron.schedule('cleanup-rooms', '0 * * * *', $$select public.cleanup_old_rooms()$$);

-- Developer settings: which AI agent writes the characters' chat, and its API key.
-- Only the Edge Functions (service role) can read or write this table; players cannot, even if they inspect the game.
create table if not exists public.dev_config (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.dev_config enable row level security;
revoke all on public.dev_config from anon, authenticated;
-- (no policies on purpose)
