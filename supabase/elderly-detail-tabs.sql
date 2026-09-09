-- Run once in Supabase Dashboard > SQL Editor.
-- No sample records are inserted by this script.

create table if not exists public.elderly_schedules (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_list(id) on delete cascade,
  category text not null,
  item text not null,
  scheduled_time time not null,
  schedule_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.elderly_alerts (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_list(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  severity text not null,
  description text not null,
  person_in_charge text,
  created_at timestamptz not null default now()
);

create table if not exists public.family_visit_records (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly_list(id) on delete cascade,
  visited_at timestamptz not null,
  visitor text not null,
  relationship text not null,
  duration text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists elderly_schedules_elderly_id_idx on public.elderly_schedules (elderly_id, scheduled_time);
create index if not exists elderly_alerts_elderly_id_idx on public.elderly_alerts (elderly_id, occurred_at desc);
create index if not exists family_visit_records_elderly_id_idx on public.family_visit_records (elderly_id, visited_at desc);

alter table public.elderly_schedules enable row level security;
alter table public.elderly_alerts enable row level security;
alter table public.family_visit_records enable row level security;

grant select on public.elderly_schedules, public.elderly_alerts, public.family_visit_records to authenticated;

drop policy if exists "Authenticated users can read elderly schedules" on public.elderly_schedules;
create policy "Authenticated users can read elderly schedules"
on public.elderly_schedules for select to authenticated using (true);

drop policy if exists "Authenticated users can read elderly alerts" on public.elderly_alerts;
create policy "Authenticated users can read elderly alerts"
on public.elderly_alerts for select to authenticated using (true);

drop policy if exists "Authenticated users can read family visits" on public.family_visit_records;
create policy "Authenticated users can read family visits"
on public.family_visit_records for select to authenticated using (true);
