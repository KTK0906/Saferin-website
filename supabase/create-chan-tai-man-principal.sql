-- Link the existing Supabase Auth user to the application Principal account.
insert into public.app_users (id, username, role, is_active, email)
values (
  '56faad10-7bda-45ac-a9ab-d133100b4b3e',
  'Chan Tai Man',
  'Principal',
  true,
  'chantaiman_principal@gmail.com'
)
on conflict (id) do update
set username = excluded.username,
    role = excluded.role,
    is_active = true,
    email = excluded.email;

-- Verify the account after the upsert.
select id, username, role, is_active, email
from public.app_users
where id = '56faad10-7bda-45ac-a9ab-d133100b4b3e';
