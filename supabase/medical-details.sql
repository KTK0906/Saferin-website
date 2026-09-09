-- Run once in Supabase Dashboard > SQL Editor.
-- This creates the missing database tables required by the Elderly Details page.
-- It intentionally inserts no medical data.

create table if not exists public.medical_information (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null unique references public.elderly(id) on delete cascade,
  conditions text[] not null default '{}',
  allergies text[] not null default '{}',
  medications text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_checks (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  check_date timestamptz not null,
  next_visit timestamptz,
  created_at timestamptz not null default now()
);

alter table public.medical_information enable row level security;
alter table public.medical_checks enable row level security;
alter table public.notes_remarks enable row level security;

grant select on public.medical_information, public.medical_checks, public.notes_remarks to authenticated;

drop policy if exists "Authenticated users can read medical information" on public.medical_information;
create policy "Authenticated users can read medical information"
  on public.medical_information for select to authenticated using (true);

drop policy if exists "Authenticated users can read medical checks" on public.medical_checks;
create policy "Authenticated users can read medical checks"
  on public.medical_checks for select to authenticated using (true);

drop policy if exists "Authenticated users can read notes remarks" on public.notes_remarks;
create policy "Authenticated users can read notes remarks"
  on public.notes_remarks for select to authenticated using (true);
