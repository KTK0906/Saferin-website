-- Run this once in Supabase Dashboard > SQL Editor.
-- It permits signed-in application users to read Emergency Contacts.
-- The browser application must never use a service-role key to bypass RLS.

alter table public.emergency_contacts enable row level security;

grant select on table public.emergency_contacts to authenticated;

drop policy if exists "Authenticated users can read emergency contacts"
  on public.emergency_contacts;

create policy "Authenticated users can read emergency contacts"
  on public.emergency_contacts
  for select
  to authenticated
  using (true);
