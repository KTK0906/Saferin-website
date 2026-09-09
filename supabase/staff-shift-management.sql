create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  shift text not null check (shift in ('Morning','Afternoon','Night')),
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'Scheduled',
  created_at timestamptz not null default now()
);
alter table public.staff_shifts enable row level security;
grant select, insert, update, delete on public.staff_shifts to authenticated;
drop policy if exists "Authenticated users manage staff shifts" on public.staff_shifts;
create policy "Authenticated users manage staff shifts" on public.staff_shifts for all to authenticated using (true) with check (true);

insert into public.staff_shifts (staff_id, shift, shift_date, start_time, end_time, status)
select id, 'Morning', current_date, '08:00', '16:00', 'Scheduled'
from public.staff order by created_at nulls last, id limit 1;
insert into public.staff_shifts (staff_id, shift, shift_date, start_time, end_time, status)
select id, 'Afternoon', current_date + 1, '16:00', '00:00', 'Scheduled'
from public.staff order by created_at nulls last, id offset 1 limit 1;
insert into public.staff_shifts (staff_id, shift, shift_date, start_time, end_time, status)
select id, 'Night', current_date + 2, '00:00', '08:00', 'Scheduled'
from public.staff order by created_at nulls last, id offset 2 limit 1;
