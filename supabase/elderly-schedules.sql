-- Run once in Supabase Dashboard > SQL Editor.
-- Creates the per-resident Schedule records used by the Elderly Details tab.
-- No sample schedules are inserted.

create table if not exists public.elderly_schedules (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  category text not null,
  item text not null,
  scheduled_time time not null,
  schedule_type text not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists elderly_schedules_resident_time_idx
  on public.elderly_schedules (elderly_id, scheduled_time);

alter table public.elderly_schedules enable row level security;
grant select, insert, update, delete on table public.elderly_schedules to authenticated;

drop policy if exists "Authenticated users can read elderly schedules"
  on public.elderly_schedules;

create policy "Authenticated users can read elderly schedules"
  on public.elderly_schedules
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add elderly schedules" on public.elderly_schedules;
create policy "Authenticated users can add elderly schedules"
  on public.elderly_schedules for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update elderly schedules" on public.elderly_schedules;
create policy "Authenticated users can update elderly schedules"
  on public.elderly_schedules for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete elderly schedules" on public.elderly_schedules;
create policy "Authenticated users can delete elderly schedules"
  on public.elderly_schedules for delete to authenticated using (true);
