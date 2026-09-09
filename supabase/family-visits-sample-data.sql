-- Sample family visits for Chan Tai Man.
-- The elderly ID is resolved dynamically from the current elderly table.
with resident as (
  select id
  from public.elderly
  where lower(trim(name)) = lower('Chan Tai Man')
  limit 1
)
insert into public.family_visit_records
  (elderly_id, visited_at, visitor, relationship, duration, status, notes)
select resident.id, v.visited_at, v.visitor, v.relationship, v.duration, v.status, v.notes
from resident
cross join (values
  (now() - interval '2 days', 'Chan Mei Ling', 'Daughter', '1 hour', 'Completed', 'Brought personal items and spent time with the resident.'),
  (now() - interval '8 days', 'Chan Wai Ming', 'Son', '45 minutes', 'Completed', 'Family check-in and conversation.'),
  (now() + interval '3 days', 'Chan Mei Ling', 'Daughter', '1 hour', 'Scheduled', 'Regular family visit.')
) as v(visited_at, visitor, relationship, duration, status, notes);
