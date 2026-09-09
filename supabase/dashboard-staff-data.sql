-- Run this once in Supabase Dashboard > SQL Editor.
-- It is safe to run after the original dashboard tables have been created.

-- 1. Store the tasks shown in the Dashboard > Staff Tasks panel.
create table if not exists public.staff_tasks (
  id uuid primary key default gen_random_uuid(),
  time text not null,
  zone text not null,
  elderly text not null,
  action text not null,
  staff text not null,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

alter table public.staff_tasks enable row level security;
grant select on public.staff_tasks to authenticated;

drop policy if exists "Authenticated users can read staff tasks" on public.staff_tasks;
create policy "Authenticated users can read staff tasks"
on public.staff_tasks
for select
to authenticated
using (true);

-- 2. Add the fields used by Dashboard > Available Staff.
alter table public.available_staff
  add column if not exists status text not null default 'Available',
  add column if not exists load integer not null default 0;

-- Ensure existing rows get usable values too.
update public.available_staff
set
  status = coalesce(nullif(status, ''), 'Available'),
  load = coalesce(load, 0);

-- 3. Optional sample tasks. They are inserted only when no task exists yet.
insert into public.staff_tasks (time, zone, elderly, action, staff, status)
select *
from (
  values
    ('08:00', 'A', 'John Doe', 'Take Medicine', 'Nurse Wilson', 'Pending'),
    ('09:00', 'A', 'Jane Smith', 'Take Medicine', 'Nurse Wilson', 'Pending')
) as sample(time, zone, elderly, action, staff, status)
where not exists (select 1 from public.staff_tasks);

-- 4. Confirm the Dashboard can now read both data sets.
select * from public.staff_tasks order by created_at desc;
select id, zone, name, role, status, load from public.available_staff order by created_at asc;
