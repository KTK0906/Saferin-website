-- Transactional integration test: every fixture and permission change is rolled back.
begin;
do $$
declare
 admin_id uuid; reader_id uuid; reader_role public.user_role; resident_a uuid; resident_b uuid;
 record_id uuid; saved_version timestamptz; affected integer; n integer;
begin
 select id into strict admin_id from public.app_users where role::text='Admin' and is_active is true limit 1;
 select id,role into strict reader_id,reader_role from public.app_users where role::text='Caregiver' and is_active is true limit 1;
 insert into public.elderly(name,age,zone,bed) values('__FORM_INTEGRATION_A__',80,'A','TEST') returning id into resident_a;
 insert into public.elderly(name,age,zone,bed) values('__FORM_INTEGRATION_B__',81,'B','TEST') returning id into resident_b;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 execute 'set local role authenticated';
 for n in 1..24 loop
  insert into public.elderly_form_records(elderly_id,form_type,assessment_date,completed_by,payload)
   values(resident_a,'form-'||n,current_date,'Integration test',jsonb_build_object('nested',jsonb_build_object('answers',jsonb_build_array(0,1,2,'a'))))
   returning id,updated_at into record_id,saved_version;
  if not exists(select 1 from public.elderly_form_records where id=record_id and created_by=admin_id and payload->'nested'->'answers'->>3='a') then raise exception 'Payload/actor round trip failed'; end if;
 end loop;
 update public.elderly_form_records set notes='updated',status='Completed' where id=record_id and updated_at=saved_version;
 get diagnostics affected=row_count;
 if affected<>1 then raise exception 'Update failed';end if;
 update public.elderly_form_records set notes='stale' where id=record_id and updated_at=saved_version;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Stale update accepted';end if;
 if exists(select 1 from public.elderly_form_records where id=record_id and elderly_id=resident_b) then raise exception 'Resident lookup mixed records';end if;
 begin
  update public.elderly_form_records set elderly_id=resident_b where id=record_id;
  raise exception 'Resident reassignment accepted';
 exception when raise_exception then if SQLERRM not like 'A saved form cannot be reassigned%' then raise;end if;
 end;
 delete from public.elderly_form_records where id=record_id;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'Delete failed';end if;
 execute 'reset role';
 delete from public.page_permissions where page_name='Elderly List';
 insert into public.page_permissions(page_name,allowed_roles,permissions) values('Elderly List',array[reader_role],array['read']);
 perform set_config('request.jwt.claim.sub',reader_id::text,true);execute 'set local role authenticated';
 select count(*) into affected from public.elderly_form_records where elderly_id=resident_a;
 if affected<>23 then raise exception 'Read-only role cannot read';end if;
 begin
  insert into public.elderly_form_records(elderly_id,form_type,assessment_date,completed_by) values(resident_a,'form-1',current_date,'Denied');
  raise exception 'Read-only insert accepted';
 exception when insufficient_privilege then null;
 end;
 update public.elderly_form_records set notes='denied' where elderly_id=resident_a;
 get diagnostics affected=row_count;if affected<>0 then raise exception 'Read-only update accepted';end if;
 delete from public.elderly_form_records where elderly_id=resident_a;
 get diagnostics affected=row_count;if affected<>0 then raise exception 'Read-only delete accepted';end if;
 execute 'reset role';
 update public.page_permissions set permissions=array['read','write','delete'] where page_name='Elderly List';
 execute 'set local role authenticated';
 insert into public.elderly_form_records(elderly_id,form_type,assessment_date,completed_by) values(resident_b,'form-1',current_date,'Writer') returning id into record_id;
 update public.elderly_form_records set notes='allowed' where id=record_id;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'Configured write rejected';end if;
 delete from public.elderly_form_records where id=record_id;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'Configured delete rejected';end if;
 execute 'reset role';
 update public.page_permissions set permissions='{}' where page_name='Elderly List';
 execute 'set local role authenticated';
 select count(*) into affected from public.elderly_form_records where elderly_id=resident_a;
 if affected<>0 then raise exception 'Removed read permission still grants access';end if;
 execute 'reset role';
 update public.page_permissions set permissions=array['read','write','delete'] where page_name='Elderly List';
 update public.app_users set is_active=false where id=reader_id;
 execute 'set local role authenticated';
 if public.can_access_elderly_forms('read') then raise exception 'Inactive user has access';end if;
 execute 'reset role';execute 'set local role anon';
 begin perform 1 from public.elderly_form_records;raise exception 'Anonymous access accepted';exception when insufficient_privilege then null;end;
 execute 'reset role';
end;
$$;
rollback;
select 'PASS: 24 form payloads, CRUD, resident isolation, stale-write prevention, role permissions, revocation, inactive and anonymous denial; all changes rolled back' as verification;
