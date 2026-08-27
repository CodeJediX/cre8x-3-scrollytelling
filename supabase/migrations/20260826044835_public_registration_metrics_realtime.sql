-- Public, aggregate-only registration telemetry. Participant rows remain private.
create table public.registration_metrics (
  id smallint primary key default 1 check (id = 1),
  total_players integer not null default 0 check (total_players >= 0),
  teams_count integer not null default 0 check (teams_count >= 0),
  solo_count integer not null default 0 check (solo_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.registration_metrics enable row level security;

create policy registration_metrics_public_read
on public.registration_metrics
for select
to anon, authenticated
using (true);

grant select on public.registration_metrics to anon, authenticated;

create or replace function public.refresh_registration_metrics()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.registration_metrics (id, total_players, teams_count, solo_count, updated_at)
  select
    1,
    count(*) filter (where registration_status <> 'rejected')::integer,
    (
      select count(*)::integer
      from public.teams
      where status in ('active', 'approved', 'locked')
    ),
    count(*) filter (
      where registration_type = 'solo'
        and registration_status <> 'rejected'
    )::integer,
    now()
  from public.registrations
  on conflict (id) do update
  set total_players = excluded.total_players,
      teams_count = excluded.teams_count,
      solo_count = excluded.solo_count,
      updated_at = excluded.updated_at;

  return null;
end;
$$;

revoke all on function public.refresh_registration_metrics() from public, anon, authenticated;

create trigger refresh_metrics_after_registration_change
after insert or update or delete on public.registrations
for each statement execute function public.refresh_registration_metrics();

create trigger refresh_metrics_after_team_change
after insert or update or delete on public.teams
for each statement execute function public.refresh_registration_metrics();

-- Initialize the singleton metrics row.
insert into public.registration_metrics (id) values (1);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'registration_metrics'
    ) then
    execute 'alter publication supabase_realtime add table public.registration_metrics';
  end if;
end;
$$;

-- Populate the initial values after triggers and publication are ready.
update public.registration_metrics
set total_players = (
      select count(*)::integer from public.registrations where registration_status <> 'rejected'
    ),
    teams_count = (
      select count(*)::integer from public.teams where status in ('active', 'approved', 'locked')
    ),
    solo_count = (
      select count(*)::integer
      from public.registrations
      where registration_type = 'solo' and registration_status <> 'rejected'
    ),
    updated_at = now()
where id = 1;
