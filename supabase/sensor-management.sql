-- Run once in Supabase Dashboard > SQL Editor.
-- Creates the data source used by the Sensor Management page.

create sequence if not exists public.sensor_devices_number_seq;

-- Keep the generated SN-### IDs ahead of any manually seeded rows.
-- Run this after the starter rows (or any manual imports) are present.

create table if not exists public.sensor_devices (
  id text primary key default (
    'SN-' || lpad(nextval('public.sensor_devices_number_seq')::text, 3, '0')
  ),
  name text not null,
  sensor_type text not null,
  zone text not null,
  location text not null,
  status text not null default 'Active',
  signal_strength integer not null default 0 check (signal_strength >= 0 and signal_strength <= 100),
  last_reading timestamptz,
  last_maintenance date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sensor_devices_filter_idx
  on public.sensor_devices (status, sensor_type, zone);

create index if not exists sensor_devices_location_idx
  on public.sensor_devices (location);

alter table public.sensor_devices enable row level security;

grant select, insert, update, delete on table public.sensor_devices to authenticated;
grant usage, select on sequence public.sensor_devices_number_seq to authenticated;

drop policy if exists "Authenticated users can read sensor devices"
  on public.sensor_devices;
create policy "Authenticated users can read sensor devices"
  on public.sensor_devices for select to authenticated using (true);

drop policy if exists "Authenticated users can add sensor devices"
  on public.sensor_devices;
create policy "Authenticated users can add sensor devices"
  on public.sensor_devices for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update sensor devices"
  on public.sensor_devices;
create policy "Authenticated users can update sensor devices"
  on public.sensor_devices for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete sensor devices"
  on public.sensor_devices;
create policy "Authenticated users can delete sensor devices"
  on public.sensor_devices for delete to authenticated using (true);

-- Optional starter rows for visual verification. Remove this block if you do not want demo data.
insert into public.sensor_devices (
  id,
  name,
  sensor_type,
  zone,
  location,
  status,
  signal_strength,
  last_reading,
  last_maintenance
)
select *
from (
  values
    ('SN-001', 'Bedroom Motion Sensor', 'Motion', 'A', 'Bed101 - John Smith', 'Active', 85, '2025-04-06 11:30:22+08'::timestamptz, '2025-03-15'::date),
    ('SN-002', 'Bathroom Fall Detector', 'Fall', 'A', 'Bed101 - John Smith', 'Active', 72, '2025-04-06 11:45:10+08'::timestamptz, '2025-03-15'::date),
    ('SN-003', 'Bed Pressure Sensor', 'Pressure', 'A', 'Bed101 - John Smith', 'Active', 90, '2025-04-06 11:50:05+08'::timestamptz, '2025-03-15'::date),
    ('SN-004', 'Living Room Motion Sensor', 'Motion', 'B', 'Bed102 - Elizabeth Johnson', 'Inactive', 15, '2025-04-06 09:22:46+08'::timestamptz, '2025-02-20'::date),
    ('SN-005', 'Door Contact Sensor', 'Contact', 'B', 'Bed102 - Elizabeth Johnson', 'Maintenance', 45, '2025-04-06 08:15:30+08'::timestamptz, '2025-04-01'::date),
    ('SN-006', 'Temperature Sensor', 'Temperature', 'C', 'Bed103 - Robert Davis', 'Warning', 60, '2025-04-06 10:45:12+08'::timestamptz, '2025-03-10'::date),
    ('SN-007', 'Wearable Health Tracker', 'Wearable', 'C', 'Bed103 - Robert Davis', 'Active', 78, '2025-04-06 11:55:00+08'::timestamptz, '2025-03-22'::date)
) as sample(id, name, sensor_type, zone, location, status, signal_strength, last_reading, last_maintenance)
where not exists (
  select 1
  from public.sensor_devices existing
  where existing.id = sample.id
);

select setval(
  'public.sensor_devices_number_seq',
  greatest(coalesce((select max((substring(id from '[0-9]+$'))::integer)
    from public.sensor_devices
    where id ~ '^SN-[0-9]+$'), 0), 1),
  true
);
