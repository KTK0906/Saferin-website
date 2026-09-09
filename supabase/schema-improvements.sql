-- Safe, backwards-compatible schema improvements.
-- Run this in Supabase SQL Editor after taking a database backup.

-- 1) Add missing relational columns without removing existing frontend fields.
alter table public.staff add column if not exists department text;
alter table public.staff add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
update public.staff set department = 'Care Services' where department is null;
alter table public.staff alter column department set default 'Care Services';
alter table public.staff alter column department set not null;

alter table public.staff_tasks add column if not exists staff_id uuid;
alter table public.staff_tasks add column if not exists elderly_id uuid;

-- Backfill IDs from the legacy text values where possible.
update public.staff_tasks t
set staff_id = s.id
from public.staff s
where t.staff_id is null and lower(trim(t.staff)) = lower(trim(s.name));

update public.staff_tasks t
set elderly_id = e.id
from public.elderly e
where t.elderly_id is null and lower(trim(t.elderly)) = lower(trim(e.name));

-- Foreign keys are NOT VALID so existing orphan rows do not block deployment.
alter table public.staff_tasks drop constraint if exists staff_tasks_staff_fk;
alter table public.staff_tasks add constraint staff_tasks_staff_fk
  foreign key (staff_id) references public.staff(id) on delete set null not valid;
alter table public.staff_tasks drop constraint if exists staff_tasks_elderly_fk;
alter table public.staff_tasks add constraint staff_tasks_elderly_fk
  foreign key (elderly_id) references public.elderly(id) on delete set null not valid;

alter table public.staff_shifts drop constraint if exists staff_shifts_staff_fk;
alter table public.staff_shifts add constraint staff_shifts_staff_fk
  foreign key (staff_id) references public.staff(id) on delete cascade not valid;

alter table public.user_activity_logs drop constraint if exists user_activity_logs_staff_fk;
alter table public.user_activity_logs add constraint user_activity_logs_staff_fk
  foreign key (staff_id) references public.staff(id) on delete cascade not valid;

alter table public.family_visit_records drop constraint if exists family_visit_records_elderly_fk;
alter table public.family_visit_records add constraint family_visit_records_elderly_fk
  foreign key (elderly_id) references public.elderly(id) on delete cascade not valid;

-- Add the remaining elderly relationships when they do not already exist.
do $$
declare t text;
begin
  foreach t in array array['elderly_schedules','emergency_contacts','health_risk','health_vitals','medical_checks','medical_information','notes_remarks','ot_pt_status','sensor_readings'] loop
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='elderly_id') then
      execute format('alter table public.%I drop constraint if exists %I', t, t || '_elderly_fk');
      execute format('alter table public.%I add constraint %I foreign key (elderly_id) references public.elderly(id) on delete cascade not valid', t, t || '_elderly_fk');
    end if;
  end loop;
end $$;

-- 2) Consistent updated_at maintenance for mutable tables.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['elderly','elderly_schedules','family_visit_records','medical_information','sensor_devices'] loop
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='updated_at') then
      execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
      execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || t || '_updated_at', t);
    end if;
  end loop;
end $$;

-- 3) Indexes for the filters and detail pages.
create index if not exists staff_zone_idx on public.staff(zone);
create index if not exists staff_status_idx on public.staff(status);
create index if not exists staff_shifts_staff_date_idx on public.staff_shifts(staff_id, shift_date);
create index if not exists family_visits_elderly_date_idx on public.family_visit_records(elderly_id, visited_at desc);
create index if not exists alert_history_occurred_idx on public.alert_request_history(occurred_at desc);
create index if not exists activity_logs_staff_date_idx on public.user_activity_logs(staff_id, occurred_at desc);
create index if not exists sensor_devices_zone_status_idx on public.sensor_devices(zone, status);
create index if not exists staff_tasks_staff_id_idx on public.staff_tasks(staff_id);
create index if not exists staff_tasks_elderly_id_idx on public.staff_tasks(elderly_id);

-- Department is owned by staff; shifts reference staff_id only.
alter table public.staff_shifts drop column if exists department;

-- After cleanup, validate the constraints explicitly:
-- alter table public.staff_tasks validate constraint staff_tasks_staff_fk;
-- alter table public.staff_tasks validate constraint staff_tasks_elderly_fk;
