create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.registration_type as enum ('solo', 'team');
create type public.eligibility_status as enum ('pending', 'eligible', 'rejected');
create type public.registration_status as enum ('pending_email_verification', 'pending_eligibility_review', 'registered', 'rejected');
create type public.team_status as enum ('active', 'approved', 'rejected', 'disqualified', 'locked');
create type public.team_role as enum ('leader', 'member');
create type public.round_status as enum ('coming_soon', 'open', 'closed', 'completed');
create type public.submission_status as enum ('draft', 'submitted', 'under_review', 'finalist', 'not_selected', 'winner');
create type public.announcement_priority as enum ('normal', 'important', 'urgent');

create sequence public.participant_code_seq start 1;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email citext not null unique,
  phone text,
  university text,
  faculty text,
  degree text,
  academic_year text,
  student_id text,
  student_id_document text,
  profile_image text,
  linkedin_url text,
  portfolio_url text,
  behance_url text,
  figma_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_identity_matches check (id = auth_user_id)
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'super_admin', 'checkin_staff')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null check (char_length(team_name) between 2 and 100),
  team_code text not null unique check (team_code ~ '^CRX3-[A-Z0-9]{6}$'),
  leader_id uuid not null references public.profiles(id) on delete restrict,
  expected_size smallint not null default 2 check (expected_size between 1 and 4),
  status public.team_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.team_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (team_id, user_id),
  unique (user_id)
);
create unique index one_leader_per_team on public.team_members(team_id) where role = 'leader';

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.profiles(id) on delete cascade,
  registration_type public.registration_type not null,
  team_id uuid references public.teams(id) on delete cascade,
  eligibility_status public.eligibility_status not null default 'pending',
  registration_status public.registration_status not null default 'pending_eligibility_review',
  participant_code text not null unique check (participant_code ~ '^CRX3-[0-9]{4}-[0-9]{4,}$'),
  undergraduate_confirmed boolean not null default false,
  rules_accepted boolean not null default false,
  privacy_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registration_team_consistency check ((registration_type = 'solo' and team_id is null) or (registration_type = 'team' and team_id is not null))
);

create table public.competition_rounds (
  id uuid primary key default gen_random_uuid(),
  round_name text not null,
  round_slug text not null unique,
  description text,
  opening_date timestamptz,
  closing_date timestamptz,
  visibility boolean not null default false,
  status public.round_status not null default 'coming_soon',
  sort_order smallint not null default 0,
  submission_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_round_window check (closing_date is null or opening_date is null or closing_date > opening_date)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.competition_rounds(id) on delete cascade,
  participant_id uuid references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  description text,
  figma_url text,
  prototype_url text,
  supporting_url text,
  document_url text,
  pitch_deck_url text,
  supporting_files jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  status public.submission_status not null default 'draft',
  locked_at timestamptz,
  constraint submission_owner check (num_nonnulls(participant_id, team_id) = 1)
);
create unique index one_solo_submission_per_round on public.submissions(round_id, participant_id) where participant_id is not null;
create unique index one_team_submission_per_round on public.submissions(round_id, team_id) where team_id is not null;

create table public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null, message text not null,
  priority public.announcement_priority not null default 'normal', active boolean not null default true,
  show_on_homepage boolean not null default true, show_on_dashboard boolean not null default true,
  published_at timestamptz not null default now(), created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, message text not null, read boolean not null default false,
  action_url text, created_at timestamptz not null default now()
);

create table public.event_settings (
  key text primary key, value jsonb not null, description text, is_public boolean not null default false,
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(), question text not null, answer text not null,
  sort_order smallint not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(), participant_id uuid not null unique references public.profiles(id) on delete cascade,
  pass_token uuid not null unique default gen_random_uuid(), checked_in boolean not null default false,
  checked_in_at timestamptz, scanned_by uuid references public.admin_users(user_id), created_at timestamptz not null default now()
);

create index registrations_team_idx on public.registrations(team_id);
create index registrations_status_idx on public.registrations(registration_status, eligibility_status);
create index registrations_created_idx on public.registrations(created_at desc);
create index team_members_team_idx on public.team_members(team_id);
create index submissions_round_status_idx on public.submissions(round_id, status);
create index notifications_user_unread_idx on public.notifications(user_id, read, created_at desc);
create index announcements_active_published_idx on public.announcements(active, published_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger teams_updated before update on public.teams for each row execute function public.set_updated_at();
create trigger registrations_updated before update on public.registrations for each row execute function public.set_updated_at();
create trigger rounds_updated before update on public.competition_rounds for each row execute function public.set_updated_at();
create trigger submissions_updated before update on public.submissions for each row execute function public.set_updated_at();
create trigger faqs_updated before update on public.faqs for each row execute function public.set_updated_at();

create or replace function public.issue_participant_pass() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.registration_status = 'registered' and old.registration_status is distinct from 'registered' then
    insert into public.checkins(participant_id) values(new.participant_id) on conflict (participant_id) do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.issue_participant_pass() from public, anon, authenticated;
create trigger registration_pass after update of registration_status on public.registrations for each row execute function public.issue_participant_pass();

create or replace function public.create_profile_for_auth_user() returns trigger
language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  insert into public.profiles(id, auth_user_id, full_name, email)
  values (new.id, new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
create trigger auth_user_profile after insert on auth.users for each row execute function public.create_profile_for_auth_user();

create or replace function public.is_admin(check_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.admin_users where user_id = check_user and role in ('admin','super_admin'));
$$;
revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.is_team_member(check_team uuid, check_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.team_members where team_id = check_team and user_id = check_user);
$$;
revoke all on function public.is_team_member(uuid,uuid) from public, anon;
grant execute on function public.is_team_member(uuid,uuid) to authenticated;

create or replace function public.enforce_team_capacity() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare member_count integer;
begin
  perform 1 from public.teams where id = new.team_id and status = 'active' for update;
  if not found then raise exception 'TEAM_INACTIVE'; end if;
  select count(*) into member_count from public.team_members where team_id = new.team_id;
  if member_count >= 4 then raise exception 'TEAM_FULL'; end if;
  return new;
end; $$;
create trigger team_capacity before insert on public.team_members for each row execute function public.enforce_team_capacity();

create or replace function public.new_participant_code() returns text
language sql volatile set search_path = public, pg_temp as $$
  select 'CRX3-' || extract(year from now())::int || '-' || lpad(nextval('public.participant_code_seq')::text,4,'0');
$$;

create or replace function public.new_team_code() returns text
language plpgsql volatile set search_path = public, pg_temp as $$
declare candidate text;
begin
  loop
    candidate := 'CRX3-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,6));
    exit when not exists(select 1 from public.teams where team_code = candidate);
  end loop;
  return candidate;
end; $$;

create or replace function public.assert_registration_available() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare cap integer; current_people integer; is_open boolean;
begin
  select (value #>> '{}')::boolean into is_open from public.event_settings where key='registration_open' for update;
  if coalesce(is_open,false) is false then raise exception 'REGISTRATION_CLOSED'; end if;
  select (value #>> '{}')::integer into cap from public.event_settings where key='registration_capacity' for update;
  select count(*) into current_people from public.registrations where registration_status <> 'rejected';
  if current_people >= coalesce(cap,0) then raise exception 'REGISTRATION_CAPACITY_REACHED'; end if;
end; $$;
revoke all on function public.assert_registration_available() from public, anon, authenticated;

create or replace function public.register_solo(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare uid uuid := auth.uid(); code text;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then raise exception 'EMAIL_VERIFICATION_REQUIRED'; end if;
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

create or replace function public.create_team_and_register(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare uid uuid := auth.uid(); code text; invite text; new_team uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.registrations where participant_id=uid) then raise exception 'DUPLICATE_REGISTRATION'; end if;
  perform public.assert_registration_available();
  code := public.new_participant_code(); invite := public.new_team_code();
  insert into public.teams(team_name,team_code,leader_id,expected_size) values(payload->>'team_name',invite,uid,least(4,greatest(1,coalesce((payload->>'expected_size')::int,2)))) returning id into new_team;
  insert into public.team_members(team_id,user_id,role) values(new_team,uid,'leader');
  insert into public.registrations(participant_id,registration_type,team_id,participant_code,undergraduate_confirmed,rules_accepted,privacy_accepted)
  values(uid,'team',new_team,code,true,coalesce((payload->>'rules_accepted')::boolean,false),coalesce((payload->>'privacy_accepted')::boolean,false));
  insert into public.notifications(user_id,title,message) values(uid,'Your alliance has been formed','Share your invite code with up to three undergraduate teammates.');
  return jsonb_build_object('participant_code',code,'team_code',invite,'team_id',new_team);
end; $$;
revoke all on function public.create_team_and_register(jsonb) from public, anon;
grant execute on function public.create_team_and_register(jsonb) to authenticated;

create or replace function public.join_team_by_code(invite_code text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); target public.teams%rowtype; code text;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.registrations where participant_id=uid) then raise exception 'ALREADY_REGISTERED'; end if;
  select * into target from public.teams where team_code=upper(invite_code) and status='active' for update;
  if not found then raise exception 'INVALID_INVITE_CODE'; end if;
  if (select count(*) from public.team_members where team_id=target.id) >= 4 then raise exception 'TEAM_FULL'; end if;
  perform public.assert_registration_available(); code := public.new_participant_code();
  insert into public.team_members(team_id,user_id,role) values(target.id,uid,'member');
  insert into public.registrations(participant_id,registration_type,team_id,participant_code,undergraduate_confirmed,rules_accepted,privacy_accepted) values(uid,'team',target.id,code,true,true,true);
  insert into public.notifications(user_id,title,message) values(target.leader_id,'A teammate joined your alliance',(select full_name from public.profiles where id=uid)||' joined '||target.team_name||'.');
  return jsonb_build_object('participant_code',code,'team_code',target.team_code,'team_id',target.id);
end; $$;
revoke all on function public.join_team_by_code(text) from public, anon;
grant execute on function public.join_team_by_code(text) to authenticated;

create or replace function public.leave_current_team() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); membership public.team_members%rowtype; lock_date timestamptz;
begin
  select * into membership from public.team_members where user_id=uid for update;
  if not found then raise exception 'TEAM_NOT_FOUND'; end if;
  if membership.role='leader' then raise exception 'LEADER_CANNOT_LEAVE'; end if;
  select (value #>> '{}')::timestamptz into lock_date from public.event_settings where key='team_lock_date';
  if lock_date is not null and now() >= lock_date then raise exception 'TEAM_CHANGES_LOCKED'; end if;
  delete from public.registrations where participant_id=uid; delete from public.team_members where id=membership.id;
  return jsonb_build_object('left',true);
end; $$;
revoke all on function public.leave_current_team() from public, anon;
grant execute on function public.leave_current_team() to authenticated;

create or replace function public.remove_team_member(member_user_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); team_uuid uuid; lock_date timestamptz;
begin
  select id into team_uuid from public.teams where leader_id=uid and status='active' for update;
  if not found then raise exception 'LEADER_ACCESS_REQUIRED'; end if;
  select (value #>> '{}')::timestamptz into lock_date from public.event_settings where key='team_lock_date';
  if lock_date is not null and now() >= lock_date then raise exception 'TEAM_CHANGES_LOCKED'; end if;
  if member_user_id=uid then raise exception 'LEADER_CANNOT_REMOVE_SELF'; end if;
  delete from public.registrations where participant_id=member_user_id and team_id=team_uuid;
  delete from public.team_members where user_id=member_user_id and team_id=team_uuid;
  return jsonb_build_object('removed',found);
end; $$;
revoke all on function public.remove_team_member(uuid) from public, anon;
grant execute on function public.remove_team_member(uuid) to authenticated;

create or replace function public.upsert_round_submission(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); target_round public.competition_rounds%rowtype; reg public.registrations%rowtype; result_id uuid;
begin
  select * into target_round from public.competition_rounds where id=(payload->>'round_id')::uuid for update;
  if not found or target_round.status<>'open' or now()<coalesce(target_round.opening_date,now()) or now()>=coalesce(target_round.closing_date,'infinity') then raise exception 'ROUND_NOT_OPEN'; end if;
  select * into reg from public.registrations where participant_id=uid and registration_status in ('registered','pending_eligibility_review');
  if not found then raise exception 'REGISTRATION_REQUIRED'; end if;
  if reg.team_id is null then
    insert into public.submissions(round_id,participant_id,title,description,figma_url,prototype_url,supporting_url,document_url,pitch_deck_url,status,submitted_at)
    values(target_round.id,uid,payload->>'title',payload->>'description',payload->>'figma_url',payload->>'prototype_url',payload->>'supporting_url',payload->>'document_url',payload->>'pitch_deck_url',coalesce((payload->>'status')::public.submission_status,'draft'),case when payload->>'status'='submitted' then now() end)
    on conflict (round_id,participant_id) where participant_id is not null do update set title=excluded.title,description=excluded.description,figma_url=excluded.figma_url,prototype_url=excluded.prototype_url,supporting_url=excluded.supporting_url,document_url=excluded.document_url,pitch_deck_url=excluded.pitch_deck_url,status=excluded.status,submitted_at=case when excluded.status='submitted' then now() else public.submissions.submitted_at end returning id into result_id;
  else
    insert into public.submissions(round_id,team_id,title,description,figma_url,prototype_url,supporting_url,document_url,pitch_deck_url,status,submitted_at)
    values(target_round.id,reg.team_id,payload->>'title',payload->>'description',payload->>'figma_url',payload->>'prototype_url',payload->>'supporting_url',payload->>'document_url',payload->>'pitch_deck_url',coalesce((payload->>'status')::public.submission_status,'draft'),case when payload->>'status'='submitted' then now() end)
    on conflict (round_id,team_id) where team_id is not null do update set title=excluded.title,description=excluded.description,figma_url=excluded.figma_url,prototype_url=excluded.prototype_url,supporting_url=excluded.supporting_url,document_url=excluded.document_url,pitch_deck_url=excluded.pitch_deck_url,status=excluded.status,submitted_at=case when excluded.status='submitted' then now() else public.submissions.submitted_at end returning id into result_id;
  end if;
  return jsonb_build_object('submission_id',result_id);
end; $$;
revoke all on function public.upsert_round_submission(jsonb) from public, anon;
grant execute on function public.upsert_round_submission(jsonb) to authenticated;

create or replace function public.check_in_by_pass(token_value text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); checkin_row public.checkins%rowtype;
begin
  if not exists(select 1 from public.admin_users where user_id=uid and role in ('admin','super_admin','checkin_staff')) then raise exception 'STAFF_ACCESS_REQUIRED'; end if;
  select * into checkin_row from public.checkins where pass_token=token_value::uuid for update;
  if not found then raise exception 'INVALID_PASS'; end if;
  if checkin_row.checked_in then return jsonb_build_object('already_checked_in',true,'checked_in_at',checkin_row.checked_in_at); end if;
  update public.checkins set checked_in=true,checked_in_at=now(),scanned_by=uid where id=checkin_row.id;
  return jsonb_build_object('checked_in',true,'participant_id',checkin_row.participant_id);
end; $$;
revoke all on function public.check_in_by_pass(text) from public, anon;
grant execute on function public.check_in_by_pass(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.registrations enable row level security;
alter table public.competition_rounds enable row level security;
alter table public.submissions enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.event_settings enable row level security;
alter table public.faqs enable row level security;
alter table public.checkins enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using ((select auth.uid())=id or public.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated using ((select auth.uid())=id or public.is_admin()) with check ((select auth.uid())=id or public.is_admin());
create policy profiles_self_insert on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy admin_users_admin_read on public.admin_users for select to authenticated using (user_id=(select auth.uid()) or public.is_admin());
create policy teams_member_read on public.teams for select to authenticated using (public.is_team_member(id) or public.is_admin());
create policy teams_admin_write on public.teams for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy team_members_team_read on public.team_members for select to authenticated using (public.is_team_member(team_id) or public.is_admin());
create policy team_members_admin_write on public.team_members for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy registrations_self_read on public.registrations for select to authenticated using (participant_id=(select auth.uid()) or public.is_admin());
create policy registrations_admin_update on public.registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy registrations_admin_delete on public.registrations for delete to authenticated using (public.is_admin());
create policy rounds_public_read on public.competition_rounds for select to anon,authenticated using (visibility=true or public.is_admin());
create policy rounds_admin_write on public.competition_rounds for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy submissions_owner_read on public.submissions for select to authenticated using (participant_id=(select auth.uid()) or (team_id is not null and public.is_team_member(team_id)) or public.is_admin());
create policy submissions_admin_update on public.submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy submissions_admin_delete on public.submissions for delete to authenticated using (public.is_admin());
create policy announcements_public_read on public.announcements for select to anon,authenticated using ((active=true and published_at<=now()) or public.is_admin());
create policy announcements_admin_write on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy notifications_self_read on public.notifications for select to authenticated using (user_id=(select auth.uid()) or public.is_admin());
create policy notifications_self_update on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy notifications_admin_insert on public.notifications for insert to authenticated with check (public.is_admin());
create policy event_settings_public_read on public.event_settings for select to anon,authenticated using (is_public=true or public.is_admin());
create policy event_settings_admin_write on public.event_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy faqs_public_read on public.faqs for select to anon,authenticated using (active=true or public.is_admin());
create policy faqs_admin_write on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy checkins_self_read on public.checkins for select to authenticated using (participant_id=(select auth.uid()) or public.is_admin());
create policy checkins_admin_write on public.checkins for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.competition_rounds, public.announcements, public.event_settings, public.faqs to anon, authenticated;
grant select,insert,update,delete on public.profiles to authenticated;
grant select on public.teams, public.team_members, public.registrations, public.submissions, public.notifications, public.checkins, public.admin_users to authenticated;
grant update on public.registrations, public.submissions, public.notifications, public.checkins to authenticated;
grant insert on public.notifications to authenticated;
grant update,delete on public.teams, public.team_members to authenticated;
grant delete on public.registrations, public.submissions to authenticated;
grant insert,update,delete on public.competition_rounds, public.announcements, public.event_settings, public.faqs to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('profile-images','profile-images',false,3000000,array['image/png','image/jpeg','image/webp']),
('student-ids','student-ids',false,5000000,array['image/png','image/jpeg','application/pdf']),
('pretask-submissions','pretask-submissions',false,20000000,array['application/pdf','image/png','image/jpeg','application/zip']),
('final-submissions','final-submissions',false,50000000,array['application/pdf','application/zip']),
('event-assets','event-assets',true,20000000,array['image/png','image/jpeg','image/webp','video/mp4'])
on conflict (id) do nothing;

create policy storage_owner_insert on storage.objects for insert to authenticated with check (bucket_id in ('profile-images','student-ids','pretask-submissions','final-submissions') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy storage_owner_select on storage.objects for select to authenticated using ((bucket_id in ('profile-images','student-ids','pretask-submissions','final-submissions') and (storage.foldername(name))[1]=(select auth.uid())::text) or public.is_admin());
create policy storage_owner_update on storage.objects for update to authenticated using ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()) with check ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin());
create policy storage_owner_delete on storage.objects for delete to authenticated using ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin());
create policy event_assets_public_read on storage.objects for select to anon,authenticated using (bucket_id='event-assets');
create policy event_assets_admin_write on storage.objects for all to authenticated using (bucket_id='event-assets' and public.is_admin()) with check (bucket_id='event-assets' and public.is_admin());

insert into public.event_settings(key,value,description,is_public) values
('registration_open','true'::jsonb,'Server-enforced registration state',true),
('registration_capacity','500'::jsonb,'Maximum total registered people',true),
('registration_deadline','"2026-09-20T23:59:59+05:30"'::jsonb,'Registration closing timestamp',true),
('team_lock_date','"2026-09-20T23:59:59+05:30"'::jsonb,'Team membership lock timestamp',false),
('hero_announcement','"Registration is now active"'::jsonb,'Homepage announcement',true),
('milestone_label','"Registration closes in"'::jsonb,'Countdown label',true),
('finale_venue','"KDU · Final venue to be confirmed"'::jsonb,'Public venue text',true),
('results_published','false'::jsonb,'Public results gate',true);

insert into public.competition_rounds(round_name,round_slug,description,opening_date,closing_date,visibility,status,sort_order,submission_schema) values
('Registration','registration','Form your alliance or enter as a solo designer.','2026-08-26T00:00:00+05:30','2026-09-20T23:59:59+05:30',true,'open',1,'{}'),
('The Oracle Challenge','oracle-challenge','The first signal will be revealed soon.',null,null,true,'coming_soon',2,'{"fields":["title","description","figma_url","prototype_url","document_url"]}'),
('The Ascension','ascension','Selected visions advance toward Olympus.',null,null,true,'coming_soon',3,'{}'),
('The Olympus Finale','olympus-finale','A full product pitching competition at KDU.','2026-10-03T09:00:00+05:30','2026-10-03T18:00:00+05:30',true,'coming_soon',4,'{"fields":["title","description","prototype_url","pitch_deck_url"]}'),
('The Legacy','legacy','Winning visions enter the CreateX archive.',null,null,false,'coming_soon',5,'{}');

insert into public.faqs(question,answer,sort_order) values
('Who can participate?','Current undergraduate students from any recognized university may participate.',1),
('Can I participate alone?','Yes. Choose Solo registration or create a team of up to four people.',2),
('Can students from different universities form a team?','Yes. Every member must independently verify undergraduate eligibility.',3),
('Is coding required?','No. Product thinking, UX reasoning and a convincing prototype are the focus.',4),
('Can we edit our submission?','Yes, until the configured round deadline. It becomes read-only afterward.',5),
('What happens in the final round?','Finalists present a complete product concept, research, interface and prototype.',6);
