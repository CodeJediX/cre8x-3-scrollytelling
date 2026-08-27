-- Registration uses an anonymous Supabase session so participants do not need
-- email/password authentication. Their submitted email remains unique and is
-- validated by the application before this profile is updated.
alter table public.profiles alter column email drop not null;

create or replace function public.create_profile_for_auth_user() returns trigger
language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  insert into public.profiles(id, auth_user_id, full_name, email)
  values (
    new.id,
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(split_part(new.email,'@',1),''), 'Future Designer'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;

create or replace function public.register_solo(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); code text;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.registrations where participant_id=uid) then raise exception 'DUPLICATE_REGISTRATION'; end if;
  if not coalesce((payload->>'undergraduate_confirmed')::boolean,false) then raise exception 'UNDERGRADUATE_CONFIRMATION_REQUIRED'; end if;
  perform public.assert_registration_available();
  code := public.new_participant_code();
  insert into public.registrations(participant_id,registration_type,participant_code,undergraduate_confirmed,rules_accepted,privacy_accepted)
  values(uid,'solo',code,true,coalesce((payload->>'rules_accepted')::boolean,false),coalesce((payload->>'privacy_accepted')::boolean,false));
  insert into public.notifications(user_id,title,message) values(uid,'Welcome to CreateX 3.0','Your solo registration is pending eligibility review.');
  return jsonb_build_object('participant_code',code);
end; $$;
revoke all on function public.register_solo(jsonb) from public, anon;
grant execute on function public.register_solo(jsonb) to authenticated;
