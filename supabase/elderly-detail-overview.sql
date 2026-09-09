-- Existing tables already support the Overview sections:
-- medical_information: conditions, allergies, medications
-- medical_checks: check_date, next_visit
-- emergency_contacts: primary_contact
-- Add the remaining requested fields to the existing tables.
alter table public.medical_checks add column if not exists doctor text;
alter table public.medical_checks add column if not exists weight numeric;
alter table public.medical_checks add column if not exists notes text;

alter table public.emergency_contacts add column if not exists secondary_contact text;
alter table public.emergency_contacts add column if not exists doctor_contact text;

grant select on public.medical_checks, public.emergency_contacts to authenticated;
