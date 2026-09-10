-- Allow authenticated administrators to manage role/page permissions.
alter table public.page_permissions enable row level security;
drop policy if exists page_permissions_admin_select on public.page_permissions;
drop policy if exists page_permissions_admin_insert on public.page_permissions;
drop policy if exists page_permissions_admin_update on public.page_permissions;
drop policy if exists page_permissions_admin_delete on public.page_permissions;
-- All signed-in users may read the permission matrix so the client can build navigation;
-- only Admin may change it.
create policy page_permissions_admin_select on public.page_permissions for select to authenticated using (true);
create policy page_permissions_admin_insert on public.page_permissions for insert to authenticated with check (exists (select 1 from public.app_users u where u.id=auth.uid() and lower(u.role::text)='admin'));
create policy page_permissions_admin_update on public.page_permissions for update to authenticated using (exists (select 1 from public.app_users u where u.id=auth.uid() and lower(u.role::text)='admin')) with check (exists (select 1 from public.app_users u where u.id=auth.uid() and lower(u.role::text)='admin'));
create policy page_permissions_admin_delete on public.page_permissions for delete to authenticated using (exists (select 1 from public.app_users u where u.id=auth.uid() and lower(u.role::text)='admin'));

-- Seed the permissions shown in the requirements. Existing rows are updated by page name.
update public.page_permissions set permissions=array['read','write','delete'] where page_name in ('User Management','Staff Task Management','Zone Management','System Settings');
update public.page_permissions set permissions=array['read','write'] where page_name in ('Reports','Family Visits','Staff Shift Management','Historical Sensor Data','Alert/ Request History','Sensor Management','Dashboard','Elderly List','House Management','Device Management','System Logs');
