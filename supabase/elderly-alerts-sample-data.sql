-- Sample alerts for Chan Tai Man.
-- The resident ID is resolved from the current elderly table.
with resident as (
  select id
  from public.elderly
  where lower(trim(name)) = lower('Chan Tai Man')
  limit 1
)
insert into public.elderly_alerts (elderly_id, occurred_at, severity, description, person_in_charge)
select resident.id, v.occurred_at, v.severity, v.description, v.person_in_charge
from resident
cross join (values
  (now() - interval '20 minutes', 'Medium', 'Heart rate exceeded the normal range briefly.', 'Caregiver'),
  (now() - interval '3 hours', 'High', 'Bed exit detected during the evening.', 'Nurse'),
  (now() - interval '1 day', 'Info', 'Medication schedule completed successfully.', 'Caregiver')
) as v(occurred_at, severity, description, person_in_charge);
