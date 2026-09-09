-- Run once in Supabase Dashboard > SQL Editor.
-- Creates per-resident Family Visit records. No sample data is inserted.

create table if not exists public.family_visit_records (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  visited_at timestamptz not null,
  visitor text not null,
  relationship text,
  duration text,
  status text not null default 'Scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_visit_records_date_idx
  on public.family_visit_records (visited_at desc);
create index if not exists family_visit_records_elderly_idx
  on public.family_visit_records (elderly_id, visited_at desc);

alter table public.family_visit_records enable row level security;
grant select, insert, update, delete on table public.family_visit_records to authenticated;

drop policy if exists "Authenticated users can read family visits" on public.family_visit_records;
create policy "Authenticated users can read family visits" on public.family_visit_records for select to authenticated using (true);
drop policy if exists "Authenticated users can add family visits" on public.family_visit_records;
create policy "Authenticated users can add family visits" on public.family_visit_records for insert to authenticated with check (true);
drop policy if exists "Authenticated users can update family visits" on public.family_visit_records;
create policy "Authenticated users can update family visits" on public.family_visit_records for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated users can delete family visits" on public.family_visit_records;
create policy "Authenticated users can delete family visits" on public.family_visit_records for delete to authenticated using (true);
