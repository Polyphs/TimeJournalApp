-- One generic, offline-first sync table. Run in the Supabase SQL editor.
create table if not exists public.records (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null,                 -- 'slot' | 'plan' | 'block' | 'settings'
  key        text not null,                 -- e.g. '2026-10-02_14', 'b3', 'main'
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null,          -- client time, used for last-write-wins
  deleted    boolean not null default false,
  synced_at  timestamptz not null default now(), -- server time, used for pulling
  primary key (user_id, kind, key)
);
create index if not exists records_pull_idx on public.records (user_id, synced_at);

alter table public.records enable row level security;
drop policy if exists "own records" on public.records;
create policy "own records" on public.records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_synced_at() returns trigger
language plpgsql as $$ begin new.synced_at := now(); return new; end $$;
drop trigger if exists records_synced on public.records;
create trigger records_synced before insert or update on public.records
  for each row execute function public.set_synced_at();
