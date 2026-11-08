create or replace function public.stamp_elderly_form_record() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 -- Nested FK actions may clear audit IDs when an Auth account is removed.
 if TG_OP='UPDATE' and pg_trigger_depth()>1 then return new; end if;
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
