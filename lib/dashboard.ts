import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, CompetitionRound, DashboardData, SubmissionStatus } from "@/lib/types";

const demoRounds: CompetitionRound[] = [
  { id: "registration", round_name: "Registration", round_slug: "registration", description: "Eligibility review and alliance formation.", opening_date: null, closing_date: "2026-09-20T23:59:59+05:30", visibility: true, status: "open" },
  { id: "oracle", round_name: "The Oracle Challenge", round_slug: "oracle-challenge", description: "The challenge signal has not yet been released.", opening_date: null, closing_date: null, visibility: true, status: "coming_soon" },
  { id: "ascension", round_name: "The Ascension", round_slug: "ascension", description: "Shortlisted visions advance.", opening_date: null, closing_date: null, visibility: true, status: "coming_soon" },
  { id: "finale", round_name: "The Olympus Finale", round_slug: "olympus-finale", description: "Full product pitching at KDU.", opening_date: "2026-10-03T09:00:00+05:30", closing_date: "2026-10-03T18:00:00+05:30", visibility: true, status: "coming_soon" },
  { id: "legacy", round_name: "The Legacy", round_slug: "legacy", description: "Results remain sealed.", opening_date: null, closing_date: null, visibility: false, status: "coming_soon" }
];

export const demoDashboard: DashboardData = {
  profile: { fullName: "Future Designer", email: "designer@example.com", university: "Your University", profileImage: null },
  registration: { participantCode: "CRX3-2026-0142", type: "team", status: "pending_eligibility_review", eligibility: "pending", currentStage: "registration" },
  team: { id: "preview-team", name: "Olympus Interface Lab", code: "CRX3-X7K92A", isLeader: true, members: [{ id: "preview-user", name: "Future Designer", role: "leader" }] },
  notifications: [{ id: "preview-note", title: "Welcome to CreateX 3.0", message: "Your eligibility is waiting for review.", read: false, createdAt: new Date().toISOString() }],
  announcements: [], rounds: demoRounds, submissions: [], pass: null, teamChangesLocked: false, previewMode: true
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  if (!hasSupabaseEnv()) return demoDashboard;
  const supabase = await createClient();
  const [{ data: profile }, { data: registration }, { data: membership }, { data: notifications }, { data: announcements }, { data: rounds }, { data: submissions }, { data: pass }, { data: lockSetting }] = await Promise.all([
    supabase.from("profiles").select("full_name,email,university,profile_image").eq("id", userId).single(),
    supabase.from("registrations").select("participant_code,registration_type,registration_status,eligibility_status,team_id").eq("participant_id", userId).maybeSingle(),
    supabase.from("team_members").select("team_id,role").eq("user_id", userId).maybeSingle(),
    supabase.from("notifications").select("id,title,message,read,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("announcements").select("id,title,message,priority,published_at").eq("active", true).eq("show_on_dashboard", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(8),
    supabase.from("competition_rounds").select("id,round_name,round_slug,description,opening_date,closing_date,visibility,status").eq("visibility", true).order("sort_order"),
    supabase.from("submissions").select("id,round_id,title,description,figma_url,prototype_url,supporting_url,status,submitted_at").order("updated_at", { ascending: false }),
    supabase.from("checkins").select("pass_token,checked_in,checked_in_at").eq("participant_id", userId).maybeSingle(),
    supabase.from("event_settings").select("value").eq("key", "team_lock_date").maybeSingle()
  ]);

  let team: DashboardData["team"] = null;
  const membershipValue = membership as { team_id: string; role: "leader" | "member" } | null;
  if (membershipValue?.team_id) {
    const [{ data: teamRow }, { data: memberRows }] = await Promise.all([
      supabase.from("teams").select("id,team_name,team_code,leader_id").eq("id", membershipValue.team_id).single(),
      supabase.from("team_members").select("user_id,role,profiles!team_members_user_id_fkey(full_name)").eq("team_id", membershipValue.team_id).order("joined_at")
    ]);
    const teamValue = teamRow as { id: string; team_name: string; team_code: string; leader_id: string } | null;
    if (teamValue) {
      team = {
        id: teamValue.id, name: teamValue.team_name, code: teamValue.team_code, isLeader: teamValue.leader_id === userId,
        members: ((memberRows ?? []) as unknown as Array<{ user_id: string; role: "leader" | "member"; profiles: { full_name: string } | null }>).map((member) => ({ id: member.user_id, name: member.profiles?.full_name ?? "CreateX participant", role: member.role }))
      };
    }
  }

  const profileValue = profile as { full_name: string; email: string; university: string | null; profile_image: string | null } | null;
  const registrationValue = registration as { participant_code: string; registration_type: "solo" | "team"; registration_status: DashboardData["registration"] extends infer R ? R extends { status: infer S } ? S : never : never; eligibility_status: "pending" | "eligible" | "rejected" } | null;
  const visibleRounds = (rounds ?? []) as unknown as CompetitionRound[];
  const activeRound = visibleRounds.find((round) => round.status === "open")?.round_slug ?? "registration";
  const lockDate = (lockSetting as { value?: string } | null)?.value;

  return {
    profile: { fullName: profileValue?.full_name ?? "CreateX participant", email: profileValue?.email ?? "", university: profileValue?.university ?? null, profileImage: profileValue?.profile_image ?? null },
    registration: registrationValue ? { participantCode: registrationValue.participant_code, type: registrationValue.registration_type, status: registrationValue.registration_status, eligibility: registrationValue.eligibility_status, currentStage: activeRound } : null,
    team,
    notifications: ((notifications ?? []) as unknown as Array<{ id: string; title: string; message: string; read: boolean; created_at: string }>).map((item) => ({ ...item, createdAt: item.created_at })),
    announcements: (announcements ?? []) as unknown as Announcement[], rounds: visibleRounds,
    submissions: ((submissions ?? []) as unknown as Array<{ id: string; round_id: string; title: string; description: string | null; figma_url: string | null; prototype_url: string | null; supporting_url: string | null; status: SubmissionStatus; submitted_at: string | null }>).map((item) => ({ id: item.id, roundId: item.round_id, title: item.title, description: item.description, figmaUrl: item.figma_url, prototypeUrl: item.prototype_url, supportingUrl: item.supporting_url, status: item.status, submittedAt: item.submitted_at })),
    pass: pass ? { token: String((pass as { pass_token: string }).pass_token), checkedIn: Boolean((pass as { checked_in: boolean }).checked_in), checkedInAt: (pass as { checked_in_at: string | null }).checked_in_at } : null,
    teamChangesLocked: lockDate ? Date.now() >= new Date(String(lockDate)).getTime() : false
  };
}
