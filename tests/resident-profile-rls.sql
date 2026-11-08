-- Integration fixtures and permission changes are all rolled back.
begin;
do $$
declare administrator uuid; reader uuid; saved jsonb; changed jsonb; unknown_age jsonb; resident_id uuid;
 profile jsonb; contacts jsonb; medical jsonb; form_id uuid; count_rows integer;
begin
 select id into strict administrator from public.app_users where role::text='Admin' and is_active is true limit 1;
 select id into strict reader from public.app_users where role::text='Caregiver' and is_active is true limit 1;
 perform set_config('request.jwt.claim.sub',administrator::text,true);
 execute 'set local role authenticated';
 profile=jsonb_build_object('name','__INTEGRATED_PROFILE_TEST__','birth_date','1940-01-01','age',1,'gender','女','zone','A','room','TEST ROOM','bed','TEST BED','admission_date','2024-01-01','hkid','TEST ONLY','personal_details',jsonb_build_object('religion','沒有宗教信仰','relatives',jsonb_build_array(jsonb_build_object('name','Test relative','age','40'))));
 contacts='{"primary_contact":"Primary","primary_phone":"5555","doctor_contact":"Doctor"}'::jsonb;
 medical='{"conditions":["Condition"],"allergies":["Allergy"],"medications":"Medicine"}'::jsonb;
 saved=public.save_resident_profile(null,profile,contacts,medical,null);
 resident_id=(saved->'resident'->>'id')::uuid;
 if saved->'resident'->>'age'=(profile->>'age') or saved->'contacts'->>'doctor_contact'<>'Doctor' or saved->'medical'->'allergies'->>0<>'Allergy' then raise exception 'Create/DOB/related record round trip failed'; end if;
 unknown_age=public.save_resident_profile(null,(profile-'birth_date'-'age')||'{"name":"__UNKNOWN_AGE_TEST__"}'::jsonb,'{}'::jsonb,'{}'::jsonb,null);
 if unknown_age->'resident'->>'age' is not null then raise exception 'Unknown age was invented';end if;
 insert into public.elderly_form_records(elderly_id,form_type,assessment_date,completed_by,payload)
 values(resident_id,'form-14',current_date,'Test',jsonb_build_object('profileSnapshot',saved)) returning id into form_id;
 changed=public.save_resident_profile(resident_id,profile||'{"bed":"NEW BED"}'::jsonb,contacts,medical,(saved->'resident'->>'updated_at')::timestamptz);
 if changed->'resident'->>'bed'<>'NEW BED' then raise exception 'Shared profile update failed'; end if;
 if (select payload->'profileSnapshot'->'resident'->>'bed' from public.elderly_form_records where id=form_id)<>'TEST BED' then raise exception 'Historical form changed'; end if;
 begin
  -- The existing table trigger uses now(), constant within this rollback-only
  -- test transaction. Supply an older version to model a previous UI request.
  perform public.save_resident_profile(resident_id,profile,contacts,medical,(saved->'resident'->>'updated_at')::timestamptz-interval '1 second');
  raise exception 'Stale profile update accepted';
 exception when raise_exception then if SQLERRM not like 'This profile changed%' then raise;end if;end;
 begin
  perform public.save_resident_profile(resident_id,profile||'{"bed":"SHOULD ROLLBACK"}'::jsonb,contacts||'{"doctor_contact":"SHOULD ROLLBACK"}'::jsonb,'{"conditions":{}}'::jsonb,(changed->'resident'->>'updated_at')::timestamptz);
  raise exception 'Invalid related write accepted';
 exception when invalid_parameter_value then null;end;
 if (select bed from public.elderly where id=resident_id)<>'NEW BED' or (select doctor_contact from public.emergency_contacts where elderly_id=resident_id)<>'Doctor' then raise exception 'Related failure left partial profile data'; end if;
 if not exists(select 1 from public.resident_directory() where id=resident_id) then raise exception 'Directory cannot load residents';end if;
 execute 'reset role';
 update public.page_permissions set permissions=array['read'] where page_name='Elderly List';
 perform set_config('request.jwt.claim.sub',reader::text,true);
 execute 'set local role authenticated';
 if not exists(select 1 from public.elderly where id=resident_id) then raise exception 'Read-only access failed'; end if;
 begin perform public.save_resident_profile(resident_id,profile,contacts,medical,(changed->'resident'->>'updated_at')::timestamptz);raise exception 'Read-only save accepted';exception when insufficient_privilege then null;end;
 execute 'reset role';
 update public.page_permissions set permissions='{}' where page_name='Elderly List';
 execute 'set local role authenticated';
 select count(*) into count_rows from public.elderly where id=resident_id;if count_rows<>0 then raise exception 'Revoked profile read still allowed';end if;
 if not exists(select 1 from public.resident_directory() where id=resident_id) then raise exception 'Authorized visit/sensor picker stopped working';end if;
 execute 'reset role';execute 'set local role anon';
 begin perform 1 from public.elderly;raise exception 'Anonymous personal profile read accepted';exception when insufficient_privilege then null;end;
 begin perform 1 from public.resident_directory();raise exception 'Anonymous directory read accepted';exception when insufficient_privilege then null;end;
 execute 'reset role';
end $$;
rollback;
select 'PASS: atomic profile/contacts/medical CRUD, DOB age, stale-write guard, related-write rollback, historical snapshots, read/write/revocation, limited picker and anonymous denial; fixtures rolled back' as verification;
