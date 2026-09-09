-- Run once in Supabase Dashboard > SQL Editor.
-- Grants the authenticated application users permission to use Add/Edit Elderly.

alter table public.elderly enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.medical_information enable row level security;

alter table public.elderly
  alter column last_activity set default 'Not recorded',
  alter column sensor_status set default 'Normal';

grant select, insert, update on table public.elderly to authenticated;
grant select, insert, update on table public.emergency_contacts to authenticated;
grant select, insert, update on table public.medical_information to authenticated;

drop policy if exists "Authenticated users can read elderly" on public.elderly;
create policy "Authenticated users can read elderly"
  on public.elderly for select to authenticated using (true);

drop policy if exists "Authenticated users can add elderly" on public.elderly;
create policy "Authenticated users can add elderly"
  on public.elderly for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update elderly" on public.elderly;
create policy "Authenticated users can update elderly"
  on public.elderly for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can read emergency contacts" on public.emergency_contacts;
create policy "Authenticated users can read emergency contacts"
  on public.emergency_contacts for select to authenticated using (true);

drop policy if exists "Authenticated users can add emergency contacts" on public.emergency_contacts;
create policy "Authenticated users can add emergency contacts"
  on public.emergency_contacts for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update emergency contacts" on public.emergency_contacts;
create policy "Authenticated users can update emergency contacts"
  on public.emergency_contacts for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can read medical information" on public.medical_information;
create policy "Authenticated users can read medical information"
  on public.medical_information for select to authenticated using (true);

drop policy if exists "Authenticated users can add medical information" on public.medical_information;
create policy "Authenticated users can add medical information"
  on public.medical_information for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update medical information" on public.medical_information;
create policy "Authenticated users can update medical information"
  on public.medical_information for update to authenticated using (true) with check (true);
