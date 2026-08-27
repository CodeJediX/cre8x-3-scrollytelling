import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { sendCreateXEmail } from "@/lib/email";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("participant_status"), participantId: z.uuid(), eligibility: z.enum(["pending", "eligible", "rejected"]), status: z.enum(["pending_email_verification", "pending_eligibility_review", "registered", "rejected"]) }),
  z.object({ action: z.literal("round_status"), roundId: z.uuid(), status: z.enum(["coming_soon", "open", "closed", "completed"]), visibility: z.boolean() }),
  z.object({ action: z.literal("team_status"), teamId: z.uuid(), status: z.enum(["active", "approved", "rejected", "disqualified", "locked"]) }),
  z.object({ action: z.literal("setting"), key: z.enum(["registration_capacity", "registration_open", "registration_deadline", "team_lock_date", "hero_announcement", "milestone_label", "finale_venue", "results_published"]), value: z.unknown() }),
  z.object({ action: z.literal("announcement"), title: z.string().trim().min(2).max(150), message: z.string().trim().min(2).max(2000), priority: z.enum(["normal", "important", "urgent"]) }),
  z.object({ action: z.literal("checkin"), passToken: z.uuid() })
]);

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isAdmin(auth.user.id))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid admin command." }, { status: 400 });
  let result;
  if (parsed.data.action === "participant_status") {
    result = await supabase.from("registrations").update({ eligibility_status: parsed.data.eligibility, registration_status: parsed.data.status } as never).eq("participant_id", parsed.data.participantId);
    if (!result.error) {
      const approved = parsed.data.status === "registered";
      const { data: profile } = await supabase.from("profiles").select("email,full_name").eq("id", parsed.data.participantId).single();
      const person = profile as { email: string; full_name: string } | null;
      if (person) after(() => sendCreateXEmail({ to: person.email, subject: approved ? "CreateX registration approved" : "CreateX registration update", title: approved ? "YOUR PASSAGE IS APPROVED" : "REGISTRATION UPDATE", message: approved ? `${person.full_name}, your undergraduate eligibility has been approved. Your digital event pass is now available in the dashboard.` : `${person.full_name}, your registration status has been updated. Open the dashboard for details.`, action: { label: "OPEN DASHBOARD", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard` } }).catch(() => undefined));
    }
  }
  else if (parsed.data.action === "round_status") result = await supabase.from("competition_rounds").update({ status: parsed.data.status, visibility: parsed.data.visibility } as never).eq("id", parsed.data.roundId);
  else if (parsed.data.action === "team_status") result = await supabase.from("teams").update({ status: parsed.data.status } as never).eq("id", parsed.data.teamId);
  else if (parsed.data.action === "setting") result = await supabase.from("event_settings").update({ value: parsed.data.value, updated_by: auth.user.id } as never).eq("key", parsed.data.key);
  else if (parsed.data.action === "announcement") result = await supabase.from("announcements").insert({ title: parsed.data.title, message: parsed.data.message, priority: parsed.data.priority, created_by: auth.user.id, active: true } as never);
  else result = await supabase.rpc("check_in_by_pass", { token_value: parsed.data.passToken });
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
