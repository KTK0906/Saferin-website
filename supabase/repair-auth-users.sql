-- Repair Supabase Auth text fields for every existing account.
-- Run once in Supabase Dashboard > SQL Editor.
-- This does not change passwords, roles, email addresses, or delete users.
--
-- It repairs legacy/manual auth.users records that contain NULL in fields the
-- Supabase Auth service reads as strings. Those records fail password sign-in
-- with: "Database error querying schema".

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  email_change = coalesce(email_change, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null
   or email_change_token_current is null
   or email_change is null
   or phone_change is null
   or phone_change_token is null
   or reauthentication_token is null
   or raw_app_meta_data is null
   or raw_user_meta_data is null;
