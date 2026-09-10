create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(), category text not null, setting_key text not null,
  description text, value text not null, unit text, created_at timestamptz default now(), updated_at timestamptz default now(), unique(category, setting_key)
);
create table if not exists public.elderly_extra_fields (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text, is_required boolean default false, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.staff_task_categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, icon text, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.system_settings enable row level security; alter table public.elderly_extra_fields enable row level security; alter table public.staff_task_categories enable row level security;
grant select, insert, update, delete on public.system_settings, public.elderly_extra_fields, public.staff_task_categories to authenticated;
drop policy if exists "Admins manage system settings" on public.system_settings; create policy "Admins manage system settings" on public.system_settings for all to authenticated using (exists(select 1 from public.app_users where id=auth.uid() and lower(role::text)='admin' and is_active=true)) with check (exists(select 1 from public.app_users where id=auth.uid() and lower(role::text)='admin' and is_active=true));
drop policy if exists "Admins manage elderly extra fields" on public.elderly_extra_fields; create policy "Admins manage elderly extra fields" on public.elderly_extra_fields for all to authenticated using (exists(select 1 from public.app_users where id=auth.uid() and lower(role::text)='admin' and is_active=true)) with check (exists(select 1 from public.app_users where id=auth.uid() and lower(role::text)='admin' and is_active=true));
drop policy if exists "Admins manage task categories" on public.staff_task_categories; create policy "Admins manage task categories" on public.staff_task_categories for all to authenticated using (exists(select 1 from public.app_users where id=auth.uid() and lower(role::text)='admin' and is_active=true)) with check (exists(select 1 from public.app_users where id=auth.uid() and lower(role::text)='admin' and is_active=true));
