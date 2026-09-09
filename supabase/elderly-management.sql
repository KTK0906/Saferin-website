-- Run once in Supabase Dashboard > SQL Editor.
-- This creates the schema and permissions only. It inserts no elderly data.

alter table public.elderly_list
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists room text,
  add column if not exists main_caregiver text,
  add column if not exists details text,
  add column if not exists status text default 'Normal';

-- Keep newly-created records compatible with the existing Elderly List columns.
alter table public.elderly_list
  alter column last_activity set default 'Not recorded',
  alter column sensor_status set default 'Normal';

-- Existing records receive the same neutral status only when it is currently missing.
update public.elderly_list set status = 'Normal' where status is null;

-- Locations power the Zone / Room / Bed single-selection fields.
create table if not exists public.elderly_locations (
  id uuid primary key default gen_random_uuid(),
  zone text not null,
  room text not null,
  bed text not null,
  created_at timestamptz not null default now(),
  unique (zone, room, bed)
);

alter table public.elderly_locations enable row level security;
alter table public.elderly_list enable row level security;

grant select on public.elderly_locations to authenticated;
grant select, insert, update on public.elderly_list to authenticated;

drop policy if exists "Authenticated users can read elderly locations" on public.elderly_locations;
create policy "Authenticated users can read elderly locations"
on public.elderly_locations for select to authenticated using (true);

drop policy if exists "Authenticated users can read elderly list" on public.elderly_list;
create policy "Authenticated users can read elderly list"
on public.elderly_list for select to authenticated using (true);

drop policy if exists "Authenticated users can add elderly" on public.elderly_list;
create policy "Authenticated users can add elderly"
on public.elderly_list for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update elderly" on public.elderly_list;
create policy "Authenticated users can update elderly"
on public.elderly_list for update to authenticated using (true) with check (true);

-- The public bucket serves only avatar images. Application data remains in tables.
insert into storage.buckets (id, name, public)
values ('elderly-avatars', 'elderly-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can view elderly avatars" on storage.objects;
create policy "Authenticated users can view elderly avatars"
on storage.objects for select to authenticated using (bucket_id = 'elderly-avatars');

drop policy if exists "Authenticated users can upload elderly avatars" on storage.objects;
create policy "Authenticated users can upload elderly avatars"
on storage.objects for insert to authenticated with check (bucket_id = 'elderly-avatars');

drop policy if exists "Authenticated users can update elderly avatars" on storage.objects;
create policy "Authenticated users can update elderly avatars"
on storage.objects for update to authenticated using (bucket_id = 'elderly-avatars') with check (bucket_id = 'elderly-avatars');
