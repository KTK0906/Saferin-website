create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  shift text not null check (shift in ('Morning','Afternoon','Night')),
  attendance_date date not null,
  check_in time,
  check_out time,
  status text not null default 'Present',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.staff_attendance enable row level security;
grant select, insert, update, delete on public.staff_attendance to authenticated;
drop policy if exists "Authenticated users manage staff attendance" on public.staff_attendance;
create policy "Authenticated users manage staff attendance" on public.staff_attendance for all to authenticated using (true) with check (true);
create index if not exists staff_attendance_staff_date_idx on public.staff_attendance(staff_id, attendance_date desc);

insert into public.staff_attendance (staff_id, shift, attendance_date, check_in, check_out, status)
select id, 'Morning', current_date, '08:02', '16:01', 'Present' from public.staff order by created_at nulls last, id limit 1;
insert into public.staff_attendance (staff_id, shift, attendance_date, check_in, check_out, status)
select id, 'Afternoon', current_date - 1, '16:08', '23:58', 'Late' from public.staff order by created_at nulls last, id offset 1 limit 1;
insert into public.staff_attendance (staff_id, shift, attendance_date, check_in, check_out, status)
select id, 'Night', current_date - 2, '00:00', '08:00', 'Present' from public.staff order by created_at nulls last, id offset 2 limit 1;
