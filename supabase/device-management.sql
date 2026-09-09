create sequence if not exists public.device_management_number_seq;
create table if not exists public.devices (
  id text primary key default ('DEV-' || lpad(nextval('device_management_number_seq')::text, 3, '0')),
  name text not null,
  model text not null,
  assigned_to uuid references public.staff(id) on delete set null,
  status text not null default 'Active' check (status in ('Active','Maintenance','Inactive')),
  last_sync timestamptz,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.devices enable row level security;
grant select, insert, update, delete on public.devices to authenticated;
drop policy if exists "Authenticated users manage devices" on public.devices;
create policy "Authenticated users manage devices" on public.devices for all to authenticated using (true) with check (true);
create index if not exists devices_status_idx on public.devices(status);
create index if not exists devices_assigned_to_idx on public.devices(assigned_to);

insert into public.devices (name, model, assigned_to, status, last_sync, location)
select 'Ward Mobile Device', 'Samsung Galaxy Tab A8', id, 'Active', now(), 'Main Building, Floor 1'
from public.staff order by created_at nulls last, id limit 1;

insert into public.devices (name, model, assigned_to, status, last_sync, location)
select 'Nursing Station Tablet', 'Apple iPad 10th Gen', id, 'Maintenance', now() - interval '2 hours', 'East Wing, Floor 2'
from public.staff order by created_at nulls last, id offset 1 limit 1;

insert into public.devices (name, model, assigned_to, status, last_sync, location)
select 'Care Team Mobile', 'Google Pixel 8', id, 'Inactive', now() - interval '1 day', 'West Wing, Floor 3'
from public.staff order by created_at nulls last, id offset 2 limit 1;
