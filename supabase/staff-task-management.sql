-- Run once in Supabase Dashboard > SQL Editor.
-- Extends the existing staff_tasks table without inserting sample tasks.

alter table public.staff_tasks
  add column if not exists task text,
  add column if not exists description text,
  add column if not exists due_date date,
  add column if not exists priority text,
  add column if not exists status text;

-- Keep legacy required columns compatible with the new task form.
alter table public.staff_tasks
  alter column time set default to_char(current_time, 'HH24:MI'),
  alter column zone set default '',
  alter column elderly set default '';

alter table public.staff_tasks enable row level security;
grant select, insert, update, delete on table public.staff_tasks to authenticated;

drop policy if exists "Authenticated users can read staff tasks" on public.staff_tasks;
create policy "Authenticated users can read staff tasks"
  on public.staff_tasks for select to authenticated using (true);

drop policy if exists "Authenticated users can add staff tasks" on public.staff_tasks;
create policy "Authenticated users can add staff tasks"
  on public.staff_tasks for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update staff tasks" on public.staff_tasks;
create policy "Authenticated users can update staff tasks"
  on public.staff_tasks for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete staff tasks" on public.staff_tasks;
create policy "Authenticated users can delete staff tasks"
  on public.staff_tasks for delete to authenticated using (true);
