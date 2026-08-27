-- Cover the remaining foreign keys used by admin filtering, team dashboards,
-- round submissions and event check-in operations.
create index if not exists admin_users_created_by_idx on public.admin_users(created_by);
create index if not exists announcements_created_by_idx on public.announcements(created_by);
create index if not exists checkins_scanned_by_idx on public.checkins(scanned_by);
create index if not exists event_settings_updated_by_idx on public.event_settings(updated_by);
create index if not exists submissions_participant_idx on public.submissions(participant_id);
create index if not exists submissions_team_idx on public.submissions(team_id);
create index if not exists teams_leader_idx on public.teams(leader_id);
