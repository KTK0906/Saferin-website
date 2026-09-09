-- Run once in Supabase Dashboard > SQL Editor.
-- These tables store per-resident health information. No sample records are inserted.

create table if not exists public.health_vitals (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  heart_rate text,
  heart_rate_status text,
  blood_pressure text,
  blood_pressure_status text,
  temperature text,
  temperature_status text,
  oxygen_saturation text,
  oxygen_saturation_status text,
  blood_glucose text,
  blood_glucose_status text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  heart_rate text,
  heart_rate_status text,
  blood_pressure text,
  blood_pressure_status text,
  temperature text,
  temperature_status text,
  oxygen_saturation text,
  oxygen_saturation_status text,
  blood_glucose text,
  blood_glucose_status text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists health_vitals_elderly_recorded_at_idx
  on public.health_vitals (elderly_id, recorded_at desc);
create index if not exists sensor_readings_elderly_recorded_at_idx
  on public.sensor_readings (elderly_id, recorded_at desc);

alter table public.health_vitals enable row level security;
alter table public.sensor_readings enable row level security;
grant select on public.health_vitals, public.sensor_readings to authenticated;

drop policy if exists "Authenticated users can read health vitals" on public.health_vitals;
create policy "Authenticated users can read health vitals"
  on public.health_vitals for select to authenticated using (true);

drop policy if exists "Authenticated users can read sensor readings" on public.sensor_readings;
create policy "Authenticated users can read sensor readings"
  on public.sensor_readings for select to authenticated using (true);
