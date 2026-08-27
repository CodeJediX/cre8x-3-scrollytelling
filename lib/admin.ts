import { createClient } from "@/lib/supabase/server";

export interface AdminData {
  totals: { registrations: number; solo: number; teams: number; people: number; verified: number; pending: number; rejected: number; submissions: number; finalists: number; capacity: number };
  participants: Array<{ id: string; name: string; email: string; university: string; type: string; eligibility: string; status: string; code: string; createdAt: string }>;
  teams: Array<{ id: string; name: string; code: string; status: string; expectedSize: number; createdAt: string }>;
  rounds: Array<{ id: string; name: string; slug: string; status: string; visibility: boolean; openingDate: string | null; closingDate: string | null }>;
  announcements: Array<{ id: string; title: string; message: string; priority: string; active: boolean; publishedAt: string }>;
  universities: Array<{ name: string; count: number }>;
}

export async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("admin_users").select("role").eq("user_id", userId).in("role", ["admin", "super_admin"]).maybeSingle();
  return Boolean(data);
}

export async function getAdminData(): Promise<AdminData> {
  const supabase = await createClient();
  const [{ data: registrations }, { data: teams }, { data: rounds }, { data: announcements }, { data: submissions }, { data: settings }] = await Promise.all([
    supabase.from("registrations").select("participant_id,registration_type,eligibility_status,registration_status,participant_code,created_at,profiles!registrations_participant_id_fkey(full_name,email,university) ").order("created_at", { ascending: false }).limit(500),
    supabase.from("teams").select("id,team_name,team_code,status,expected_size,created_at").order("created_at", { ascending: false }),
    supabase.from("competition_rounds").select("id,round_name,round_slug,status,visibility,opening_date,closing_date").order("sort_order"),
    supabase.from("announcements").select("id,title,message,priority,active,published_at").order("published_at", { ascending: false }).limit(20),
    supabase.from("submissions").select("id,status"),
    supabase.from("event_settings").select("key,value").in("key", ["registration_capacity"])
  ]);
  const registrationRows = (registrations ?? []) as unknown as Array<{ participant_id: string; registration_type: string; eligibility_status: string; registration_status: string; participant_code: string; created_at: string; profiles: { full_name: string; email: string; university: string | null } | null }>;
  const teamRows = (teams ?? []) as unknown as Array<{ id: string; team_name: string; team_code: string; status: string; expected_size: number; created_at: string }>;
  const submissionRows = (submissions ?? []) as unknown as Array<{ id: string; status: string }>;
  const universityMap = new Map<string, number>();
  registrationRows.forEach((row) => { const name = row.profiles?.university || "Not specified"; universityMap.set(name, (universityMap.get(name) ?? 0) + 1); });
  const capacity = Number(((settings ?? []) as unknown as Array<{ key: string; value: number }>).find((item) => item.key === "registration_capacity")?.value ?? 500);
  return {
    totals: { registrations: registrationRows.length, solo: registrationRows.filter((row) => row.registration_type === "solo").length, teams: teamRows.length, people: registrationRows.filter((row) => row.registration_status !== "rejected").length, verified: registrationRows.filter((row) => row.registration_status === "registered").length, pending: registrationRows.filter((row) => row.eligibility_status === "pending").length, rejected: registrationRows.filter((row) => row.registration_status === "rejected").length, submissions: submissionRows.length, finalists: submissionRows.filter((row) => ["finalist", "winner"].includes(row.status)).length, capacity },
    participants: registrationRows.map((row) => ({ id: row.participant_id, name: row.profiles?.full_name ?? "Unknown", email: row.profiles?.email ?? "", university: row.profiles?.university ?? "Not specified", type: row.registration_type, eligibility: row.eligibility_status, status: row.registration_status, code: row.participant_code, createdAt: row.created_at })),
    teams: teamRows.map((row) => ({ id: row.id, name: row.team_name, code: row.team_code, status: row.status, expectedSize: row.expected_size, createdAt: row.created_at })),
    rounds: ((rounds ?? []) as unknown as Array<{ id: string; round_name: string; round_slug: string; status: string; visibility: boolean; opening_date: string | null; closing_date: string | null }>).map((row) => ({ id: row.id, name: row.round_name, slug: row.round_slug, status: row.status, visibility: row.visibility, openingDate: row.opening_date, closingDate: row.closing_date })),
    announcements: ((announcements ?? []) as unknown as Array<{ id: string; title: string; message: string; priority: string; active: boolean; published_at: string }>).map((row) => ({ ...row, publishedAt: row.published_at })),
    universities: [...universityMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  };
}
