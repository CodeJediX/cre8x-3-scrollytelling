import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, CompetitionRound, PublicContent } from "@/lib/types";

const fallbackRounds: CompetitionRound[] = [
  { id: "registration", round_name: "Registration", round_slug: "registration", description: "Form your alliance or enter as a solo designer.", opening_date: "2026-08-26T00:00:00+05:30", closing_date: "2026-09-20T23:59:59+05:30", visibility: true, status: "open" },
  { id: "oracle", round_name: "The Oracle Challenge", round_slug: "oracle-challenge", description: "The first signal will be revealed soon.", opening_date: null, closing_date: null, visibility: true, status: "coming_soon" },
  { id: "ascension", round_name: "The Ascension", round_slug: "ascension", description: "Selected visions advance toward Olympus.", opening_date: null, closing_date: null, visibility: true, status: "coming_soon" },
  { id: "finale", round_name: "The Olympus Finale", round_slug: "olympus-finale", description: "A full product pitching competition at KDU.", opening_date: "2026-10-03T09:00:00+05:30", closing_date: "2026-10-03T18:00:00+05:30", visibility: true, status: "coming_soon" },
  { id: "legacy", round_name: "The Legacy", round_slug: "legacy", description: "Winning visions enter the CreateX archive.", opening_date: null, closing_date: null, visibility: false, status: "coming_soon" }
];

const fallback: PublicContent = {
  heroAnnouncement: "Registration is now active",
  registrationOpen: true,
  capacity: 500,
  registeredPeople: 0,
  teamsCount: 0,
  soloRegistrations: 0,
  milestoneLabel: "Registration closes in",
  milestoneDate: "2026-09-20T23:59:59+05:30",
  finaleDate: "2026-10-03T09:00:00+05:30",
  venue: "KDU · Final venue to be confirmed",
  rounds: fallbackRounds,
  announcements: [],
  previewMode: true
};

export async function getPublicContent(): Promise<PublicContent> {
  if (!hasSupabaseEnv()) return fallback;
  try {
    const supabase = await createClient();
    const [{ data: settings }, { data: rounds }, { data: announcements }, { data: metrics }] = await Promise.all([
      supabase.from("event_settings").select("key,value").eq("is_public", true),
      supabase.from("competition_rounds").select("*").eq("visibility", true).order("sort_order"),
      supabase.from("announcements").select("id,title,message,priority,published_at").eq("active", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(3),
      supabase.from("registration_metrics").select("total_players,teams_count,solo_count").eq("id", 1).maybeSingle()
    ]);
    const values = Object.fromEntries((settings ?? []).map((item) => [String(item.key), item.value]));
    return {
      ...fallback,
      heroAnnouncement: String(values.hero_announcement ?? fallback.heroAnnouncement),
      registrationOpen: Boolean(values.registration_open ?? true),
      capacity: Number(values.registration_capacity ?? fallback.capacity),
      registeredPeople: Number((metrics as { total_players?: number } | null)?.total_players ?? 0),
      teamsCount: Number((metrics as { teams_count?: number } | null)?.teams_count ?? 0),
      soloRegistrations: Number((metrics as { solo_count?: number } | null)?.solo_count ?? 0),
      milestoneLabel: String(values.milestone_label ?? fallback.milestoneLabel),
      milestoneDate: String(values.registration_deadline ?? fallback.milestoneDate),
      venue: String(values.finale_venue ?? fallback.venue),
      rounds: (rounds as unknown as CompetitionRound[] | null) ?? fallback.rounds,
      announcements: (announcements as unknown as Announcement[] | null) ?? [],
      previewMode: false
    };
  } catch {
    return fallback;
  }
}
