-- Run once in Supabase Dashboard > SQL Editor.
-- Creates the data source used by the Alert / Request History page.

create sequence if not exists public.alert_request_history_number_seq;

create table if not exists public.alert_request_history (
  id text primary key default (
    'ALT-' || lpad(nextval('public.alert_request_history_number_seq')::text, 3, '0')
  ),
  occurred_at timestamptz not null default now(),
  alert_type text not null,
  resident text not null,
  location text not null,
  severity text not null default 'Medium',
  status text not null default 'Resolved',
  response_time text,
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alert_request_history_occurred_at_idx
  on public.alert_request_history (occurred_at desc);

create index if not exists alert_request_history_filter_idx
  on public.alert_request_history (alert_type, severity, status);

alter table public.alert_request_history enable row level security;

grant select, insert, update, delete on table public.alert_request_history to authenticated;
grant usage, select on sequence public.alert_request_history_number_seq to authenticated;

drop policy if exists "Authenticated users can read alert request history"
  on public.alert_request_history;
create policy "Authenticated users can read alert request history"
  on public.alert_request_history for select to authenticated using (true);

drop policy if exists "Authenticated users can add alert request history"
  on public.alert_request_history;
create policy "Authenticated users can add alert request history"
  on public.alert_request_history for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update alert request history"
  on public.alert_request_history;
create policy "Authenticated users can update alert request history"
  on public.alert_request_history for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete alert request history"
  on public.alert_request_history;
create policy "Authenticated users can delete alert request history"
  on public.alert_request_history for delete to authenticated using (true);

-- Optional starter data for visual verification. Remove this block if you do not want demo rows.
insert into public.alert_request_history (
  id,
  occurred_at,
  alert_type,
  resident,
  location,
  severity,
  status,
  response_time,
  details
)
select *
from (
  values
    ('ALT-001', '2025-04-06 08:23:15+08'::timestamptz, 'Fall Detection', 'John Smith', 'Room 203', 'High', 'Resolved', '2 minutes', 'Fall detection alert was acknowledged and resolved.'),
    ('ALT-002', '2025-04-05 14:45:30+08'::timestamptz, 'Medication Alert', 'Mary Johnson', 'Room 115', 'Medium', 'Resolved', '5 minutes', 'Medication reminder was handled by assigned staff.'),
    ('ALT-003', '2025-04-05 22:10:45+08'::timestamptz, 'Wandering', 'Robert Davis', 'East Wing Corridor', 'Medium', 'Resolved', '3 minutes', 'Resident was located and escorted back safely.'),
    ('ALT-004', '2025-04-04 03:15:22+08'::timestamptz, 'Vital Signs', 'Elizabeth Wilson', 'Room 127', 'High', 'Resolved', '1 minute', 'Abnormal vital signs alert was reviewed.'),
    ('ALT-005', '2025-04-03 17:30:10+08'::timestamptz, 'Call Button', 'Patricia Brown', 'Room 142', 'Low', 'Resolved', '4 minutes', 'Call button request completed.'),
    ('ALT-006', '2025-04-03 11:05:33+08'::timestamptz, 'Fall Detection', 'Thomas Miller', 'Dining Area', 'Medium', 'Resolved', '2 minutes', 'Fall detection alert was investigated.'),
    ('ALT-007', '2025-04-02 20:45:18+08'::timestamptz, 'Medication Alert', 'Jennifer Garcia', 'Room 189', 'Medium', 'Resolved', '3 minutes', 'Medication alert confirmed.'),
    ('ALT-008', '2025-04-02 09:20:55+08'::timestamptz, 'Vital Signs', 'William Martinez', 'Room 215', 'High', 'Resolved', '1 minute', 'Vital signs alert reviewed.'),
    ('ALT-009', '2025-04-01 13:10:40+08'::timestamptz, 'Wandering', 'Barbara Anderson', 'West Wing Exit', 'High', 'Resolved', '2 minutes', 'Wandering alert resolved.'),
    ('ALT-010', '2025-04-01 07:55:12+08'::timestamptz, 'Call Button', 'Richard Taylor', 'Room 156', 'Low', 'Resolved', '5 minutes', 'Call button request handled.')
) as sample(id, occurred_at, alert_type, resident, location, severity, status, response_time, details)
where not exists (
  select 1
  from public.alert_request_history existing
  where existing.id = sample.id
);
