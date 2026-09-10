create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  house_name text not null,
  address text not null,
  principal_username text not null unique,
  principal_email text not null unique,
  status text not null default 'Active' check (status in ('Active','Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users add column if not exists email text;
create unique index if not exists app_users_email_unique_idx on public.app_users (lower(email)) where email is not null;
grant select on public.app_users to authenticated;
alter table public.app_users enable row level security;
drop policy if exists "Authenticated users can verify principal accounts" on public.app_users;
create policy "Authenticated users can verify principal accounts" on public.app_users
  for select to authenticated using (true);
alter table public.houses enable row level security;
grant select, insert, update, delete on public.houses to authenticated;
drop policy if exists "Admin manages houses" on public.houses;
create policy "Admin manages houses" on public.houses for all to authenticated
using (exists (select 1 from public.app_users where id = auth.uid() and lower(role::text) = 'admin' and is_active = true))
with check (exists (select 1 from public.app_users where id = auth.uid() and lower(role::text) = 'admin' and is_active = true));
