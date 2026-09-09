-- Run once in Supabase Dashboard > SQL Editor.
create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  category text not null,
  details text not null,
  succeeded boolean not null default true
);
create index if not exists user_activity_logs_staff_date_idx on public.user_activity_logs (staff_id, occurred_at desc);
alter table public.user_activity_logs enable row level security;
grant select on table public.user_activity_logs to authenticated;
drop policy if exists "Authenticated users can read user activity logs" on public.user_activity_logs;
create policy "Authenticated users can read user activity logs" on public.user_activity_logs for select to authenticated using (true);
