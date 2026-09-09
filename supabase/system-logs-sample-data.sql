-- Sample system logs linked to an existing staff record.
-- The staff_id is resolved dynamically, so no UUID replacement is required.
with current_staff as (
  select id
  from public.staff
  order by created_at nulls last, id
  limit 1
)
insert into public.system_logs (occurred_at, staff_id, action, log_type, severity, details)
select v.occurred_at, current_staff.id, v.action, v.log_type, v.severity, v.details
from current_staff
cross join (values
  (now() - interval '5 minutes', 'User Login', 'Authentication', 'Info', 'Successful login from the staff portal'),
  (now() - interval '35 minutes', 'Profile Update', 'Data Modification', 'Info', 'Updated phone number and recent location'),
  (now() - interval '2 hours', 'Alert Acknowledged', 'Care Activity', 'Warning', 'Fall detection alert was acknowledged by staff'),
  (now() - interval '1 day', 'Password Change', 'Security Change', 'Info', 'User password was changed successfully'),
  (now() - interval '2 days', 'Failed Login', 'Authentication', 'Error', 'Failed login attempt from an unrecognized device')
) as v(occurred_at, action, log_type, severity, details);
