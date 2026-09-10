-- Alert Related settings from the provided reference image.
insert into public.system_settings (category, setting_key, description, value, unit)
values
  ('Alert Related', 'AUTO_ASSIGN_THRESHOLD', '未有接獲，自動分配人手', '180', 'seconds'),
  ('Alert Related', 'NOT_ARRIVAL_THRESHOLD', '未到達提醒', '300', 'seconds'),
  ('Alert Related', 'NOT_ARRIVAL_AFTER_REMINDER_THRESHOLD', '提醒後仍未到達，自動再分配人手', '180', 'seconds'),
  ('Alert Related', 'NOT_RESOLVED_THRESHOLD', '未解決提醒', '300', 'seconds'),
  ('Alert Related', 'NOT_RESOLVED_AFTER_REMINDER_THRESHOLD', '提醒後仍未解決，自動分配助手', '180', 'seconds'),
  ('Alert Related', 'BED_EXIT_THRESHOLD', '離床', '10', 'seconds')
on conflict (category, setting_key) do update
set description = excluded.description,
    value = excluded.value,
    unit = excluded.unit,
    updated_at = now();

select category, setting_key, description, value, unit
from public.system_settings
where category = 'Alert Related'
order by created_at;
