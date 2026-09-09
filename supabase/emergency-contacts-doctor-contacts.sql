-- Standardise the emergency contact schema. The doctor contact is stored in
-- doctor_contact; duplicate legacy columns are no longer used.
alter table public.emergency_contacts
  add column if not exists doctor_contact text;

-- Preserve existing values before removing the duplicate column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'emergency_contacts'
      and column_name = 'doctor'
  ) then
    execute 'update public.emergency_contacts set doctor_contact = coalesce(doctor_contact, doctor) where doctor is not null';
    execute 'alter table public.emergency_contacts drop column doctor';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'emergency_contacts' and column_name = 'doctor_contacts') then
    execute 'update public.emergency_contacts set doctor_contact = coalesce(doctor_contact, doctor_contacts) where doctor_contacts is not null';
    execute 'alter table public.emergency_contacts drop column doctor_contacts';
  end if;
end $$;
