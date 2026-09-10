-- Granular page permissions. Run after the existing page_permissions table exists.
alter table public.page_permissions
  add column if not exists permissions text[] not null default array['read']::text[];

update public.page_permissions
set permissions = case
  when page_name in ('User Management','Staff Task Management','Zone Management','System Settings')
    then array['read','write','delete']
  else array['read','write']
end
where permissions = array['read']::text[];

alter table public.page_permissions
  add constraint page_permissions_permissions_valid
  check (permissions <@ array['read','write','delete']::text[]);

create index if not exists page_permissions_allowed_roles_idx
  on public.page_permissions using gin (allowed_roles);
