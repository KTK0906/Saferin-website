-- Run once in Supabase Dashboard > SQL Editor.
-- Adds the optional staff profile fields required by User Management.

alter table public.staff
  add column if not exists username text,
  add column if not exists phone_number text,
  add column if not exists device text,
  add column if not exists recent_location text;

alter table public.staff enable row level security;
grant select, insert, update, delete on table public.staff to authenticated;

drop policy if exists "Authenticated users can read staff profiles" on public.staff;
create policy "Authenticated users can read staff profiles" on public.staff for select to authenticated using (true);
drop policy if exists "Authenticated users can update staff profiles" on public.staff;
create policy "Authenticated users can update staff profiles" on public.staff for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated users can add staff profiles" on public.staff;
create policy "Authenticated users can add staff profiles" on public.staff for insert to authenticated with check (true);
drop policy if exists "Authenticated users can delete staff profiles" on public.staff;
create policy "Authenticated users can delete staff profiles" on public.staff for delete to authenticated using (true);
