-- Run this once in Supabase Dashboard > SQL Editor.
-- It adds an application role to profiles. Passwords remain managed by Supabase Auth.

do $$
begin
  create type public.app_role as enum (
    'admin',
    'principal',
    'lead_nurse',
    'nurse',
    'ot_pt',
    'caregiver'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists role public.app_role not null default 'caregiver';

-- Existing accounts receive the least-privileged role until an administrator assigns one.
update public.profiles
set role = 'caregiver'
where role is null;

alter table public.profiles enable row level security;

-- A signed-in user may view only their own username and role.
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Do not permit users to change their own role from the browser.
-- Assign Admin, Principal, Lead Nurse, Nurse, or OT/PT through the Dashboard
-- (or a future server-side admin function) only.
drop policy if exists "Users can update their own profile" on public.profiles;

grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;

-- After you run this script, promote your own account in SQL Editor, e.g.:
-- update public.profiles set role = 'admin' where username = 'your_username';
