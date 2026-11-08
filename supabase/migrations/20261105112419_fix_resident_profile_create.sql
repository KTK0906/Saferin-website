-- Age may be unknown until the resident's date of birth is recorded.
alter table public.elderly alter column age drop not null;

create or replace function public.save_resident_profile(
 resident_id uuid, profile jsonb, contacts jsonb, medical jsonb,
 expected_updated_at timestamptz default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare target public.elderly; ec public.emergency_contacts; mi public.medical_information;
 dob date; admitted date; resident_age integer;
begin
 if not public.can_access_elderly_forms('write') then raise exception 'You do not have permission to edit resident profiles' using errcode='42501'; end if;
 if jsonb_typeof(profile) is distinct from 'object' or jsonb_typeof(contacts) is distinct from 'object' or jsonb_typeof(medical) is distinct from 'object' then raise exception 'Invalid profile data'; end if;
 if coalesce(btrim(profile->>'name'),'')='' or coalesce(btrim(profile->>'zone'),'')='' or coalesce(btrim(profile->>'bed'),'')='' then raise exception 'Name, zone and bed number are required'; end if;
 dob=nullif(profile->>'birth_date','')::date;
 admitted=nullif(profile->>'admission_date','')::date;
 if dob>(now() at time zone 'Asia/Hong_Kong')::date then raise exception 'Date of birth cannot be in the future'; end if;
 if dob is not null and admitted<dob then raise exception 'Admission date cannot be before date of birth'; end if;
 resident_age=case when dob is not null then extract(year from age((now() at time zone 'Asia/Hong_Kong')::date,dob))::integer else nullif(profile->>'age','')::integer end;
 if resident_age<0 or resident_age>130 then raise exception 'Age must be between 0 and 130'; end if;
 if resident_id is null then
  insert into public.elderly(name,age,zone,bed,care_level) values(btrim(profile->>'name'),resident_age,btrim(profile->>'zone'),btrim(profile->>'bed'),coalesce(nullif(profile->>'care_level',''),'Normal')::public.care_level_type) returning * into target;
 else
  select * into target from public.elderly where id=resident_id for update;
  if not found then raise exception 'Resident not found or access denied'; end if;
  if expected_updated_at is null or target.updated_at is distinct from expected_updated_at then raise exception 'This profile changed. Close and reopen it before saving'; end if;
 end if;
 update public.elderly set
  name=btrim(profile->>'name'),age=resident_age,gender=nullif(profile->>'gender',''),
  birth_date=dob,admission_date=admitted,room=nullif(btrim(profile->>'room'),''),
  resident_number=nullif(btrim(profile->>'resident_number'),''),hkid=nullif(btrim(profile->>'hkid'),''),
  marital_status=nullif(btrim(profile->>'marital_status'),''),
  care_level=coalesce(nullif(profile->>'care_level',''),'Normal')::public.care_level_type,
  zone=btrim(profile->>'zone'),bed=btrim(profile->>'bed'),
  personal_details=coalesce(profile->'personal_details','{}'::jsonb),updated_at=clock_timestamp()
 where id=target.id returning * into target;
 if not found then raise exception 'Profile update denied'; end if;
 insert into public.emergency_contacts(elderly_id,primary_contact,primary_relationship,primary_phone,secondary_contact,secondary_relationship,secondary_phone,doctor_contact)
 values(target.id,nullif(contacts->>'primary_contact',''),nullif(contacts->>'primary_relationship',''),nullif(contacts->>'primary_phone',''),nullif(contacts->>'secondary_contact',''),nullif(contacts->>'secondary_relationship',''),nullif(contacts->>'secondary_phone',''),nullif(contacts->>'doctor_contact',''))
 on conflict(elderly_id) do update set primary_contact=excluded.primary_contact,primary_relationship=excluded.primary_relationship,primary_phone=excluded.primary_phone,secondary_contact=excluded.secondary_contact,secondary_relationship=excluded.secondary_relationship,secondary_phone=excluded.secondary_phone,doctor_contact=excluded.doctor_contact
 returning * into ec;
 insert into public.medical_information(elderly_id,conditions,allergies,medications)
 values(target.id,array(select jsonb_array_elements_text(coalesce(nullif(medical->'conditions','null'::jsonb),'[]'::jsonb))),array(select jsonb_array_elements_text(coalesce(nullif(medical->'allergies','null'::jsonb),'[]'::jsonb))),nullif(medical->>'medications',''))
 on conflict(elderly_id) do update set conditions=excluded.conditions,allergies=excluded.allergies,medications=excluded.medications,updated_at=clock_timestamp()
 returning * into mi;
 return jsonb_build_object('resident',to_jsonb(target),'contacts',to_jsonb(ec),'medical',to_jsonb(mi));
end $$;
