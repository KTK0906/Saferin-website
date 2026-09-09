-- System-wide audit and operational logs.
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  staff_id uuid references public.staff(id) on delete set null,
  action text not null,
  log_type text not null check (log_type in ('Authentication','System Alert','Data Modification','Care Activity','System Maintenance','Security Alert','Data Creation','Security Change')),
  severity text not null default 'Info' check (severity in ('Info','Warning','Error')),
  details text not null,
  created_at timestamptz not null default now()
);

alter table public.system_logs enable row level security;
grant select, insert, update, delete on public.system_logs to authenticated;
drop policy if exists "Authenticated users manage system logs" on public.system_logs;
create policy "Authenticated users manage system logs" on public.system_logs
  for all to authenticated using (true) with check (true);

create index if not exists system_logs_occurred_at_idx on public.system_logs (occurred_at desc);
create index if not exists system_logs_staff_id_idx on public.system_logs (staff_id);
