-- Forms belong to an existing resident; each assessment is a separate record.
create table public.elderly_form_records (
 id uuid primary key default gen_random_uuid(),
 elderly_id uuid not null references public.elderly(id) on delete restrict,
 form_type text not null check (form_type ~ '^form-([1-9]|1[0-9]|2[0-4])$'),
 assessment_date date not null,
 completed_by text not null check (length(btrim(completed_by)) between 1 and 200),
 status text not null default 'Draft' check (status in ('Draft','Completed')),
 notes text not null default '',
 payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
 schema_version integer not null default 1 check (schema_version=1),
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 updated_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index elderly_form_records_resident_date_idx on public.elderly_form_records(elderly_id,assessment_date desc,created_at desc);
create index elderly_form_records_created_by_idx on public.elderly_form_records(created_by);
create index elderly_form_records_updated_by_idx on public.elderly_form_records(updated_by);

-- Invoker permissions: use the account role and the same page permissions as Elderly List.
create function public.can_access_elderly_forms(requested_action text) returns boolean
language sql stable security invoker set search_path='' as $$
 select requested_action in ('read','write','delete') and exists (
  select 1 from public.app_users u where u.id=(select auth.uid()) and u.is_active is true
  and (u.role::text='Admin' or exists (
   select 1 from public.page_permissions p
   where p.page_name='Elderly List' and u.role=any(p.allowed_roles)
    and 'read'=any(p.permissions) and requested_action=any(p.permissions)
  ))
 );
$$;
revoke all on function public.can_access_elderly_forms(text) from public;
grant execute on function public.can_access_elderly_forms(text) to authenticated;

create function public.stamp_elderly_form_record() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.elderly_id is distinct from old.elderly_id or new.form_type is distinct from old.form_type then
   raise exception 'A saved form cannot be reassigned to another resident or form type';
  end if;
  new.created_by=old.created_by; new.created_at=old.created_at;
 else
  new.created_by=auth.uid(); new.created_at=clock_timestamp();
 end if;
 new.updated_by=auth.uid(); new.updated_at=clock_timestamp();
 return new;
end;
$$;
revoke all on function public.stamp_elderly_form_record() from public;
create trigger stamp_elderly_form_record before insert or update on public.elderly_form_records
 for each row execute function public.stamp_elderly_form_record();

alter table public.elderly_form_records enable row level security;
revoke all on public.elderly_form_records from anon;
grant select,insert,update,delete on public.elderly_form_records to authenticated;
create policy resident_forms_read on public.elderly_form_records for select to authenticated
 using ((select public.can_access_elderly_forms('read')) and exists(select 1 from public.elderly e where e.id=elderly_id));
create policy resident_forms_insert on public.elderly_form_records for insert to authenticated
 with check ((select public.can_access_elderly_forms('write')) and created_by=(select auth.uid()) and exists(select 1 from public.elderly e where e.id=elderly_id));
create policy resident_forms_update on public.elderly_form_records for update to authenticated
 using ((select public.can_access_elderly_forms('write')) and exists(select 1 from public.elderly e where e.id=elderly_id))
 with check ((select public.can_access_elderly_forms('write')) and exists(select 1 from public.elderly e where e.id=elderly_id));
create policy resident_forms_delete on public.elderly_form_records for delete to authenticated
 using ((select public.can_access_elderly_forms('delete')) and exists(select 1 from public.elderly e where e.id=elderly_id));
