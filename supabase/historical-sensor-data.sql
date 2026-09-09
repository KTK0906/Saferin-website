create table if not exists public.historical_sensor_readings (
  id uuid primary key default gen_random_uuid(),
  sensor_id text not null references public.sensor_devices(id) on delete cascade,
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  sensor_type text not null,
  value numeric not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.historical_sensor_readings enable row level security;
grant select, insert, update, delete on public.historical_sensor_readings to authenticated;
drop policy if exists "Authenticated users manage historical sensor readings" on public.historical_sensor_readings;
create policy "Authenticated users manage historical sensor readings" on public.historical_sensor_readings for all to authenticated using (true) with check (true);
create index if not exists historical_sensor_readings_sensor_date_idx on public.historical_sensor_readings(sensor_id, recorded_at desc);
create index if not exists historical_sensor_readings_elderly_date_idx on public.historical_sensor_readings(elderly_id, recorded_at desc);
