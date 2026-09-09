-- Alerts belonging to an individual elderly resident.
-- This is separate from alert_request_history, which stores the global alert list.
create table if not exists public.elderly_alerts (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  severity text not null check (severity in ('Info', 'Low', 'Medium', 'High', 'Warning', 'Critical', 'Error')),
  description text not null,
  person_in_charge text,
  created_at timestamptz not null default now()
);

create index if not exists elderly_alerts_elderly_id_idx
  on public.elderly_alerts (elderly_id, occurred_at desc);

alter table public.elderly_alerts enable row level security;
grant select, insert, update, delete on public.elderly_alerts to authenticated;

drop policy if exists "Authenticated users can read elderly alerts" on public.elderly_alerts;
create policy "Authenticated users can read elderly alerts"
  on public.elderly_alerts for select to authenticated using (true);

drop policy if exists "Authenticated users can add elderly alerts" on public.elderly_alerts;
create policy "Authenticated users can add elderly alerts"
  on public.elderly_alerts for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update elderly alerts" on public.elderly_alerts;
create policy "Authenticated users can update elderly alerts"
  on public.elderly_alerts for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete elderly alerts" on public.elderly_alerts;
create policy "Authenticated users can delete elderly alerts"
  on public.elderly_alerts for delete to authenticated using (true);
