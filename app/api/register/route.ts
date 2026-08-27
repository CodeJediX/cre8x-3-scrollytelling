import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { soloRegistrationSchema, teamCreationSchema, teamJoinSchema } from "@/lib/validators";
import { sendCreateXEmail } from "@/lib/email";

function isOwnedPath(path: string, userId: string, allowedExtensions: string) {
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedUserId}/[0-9a-f-]{36}\\.(${allowedExtensions})$`, "i").test(path);
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const form = await request.formData();
  const mode = String(form.get("mode") ?? "");
  const raw = {
    mode, fullName: form.get("fullName"), email: form.get("email"), phone: form.get("phone"), university: form.get("university"),
    faculty: form.get("faculty"), degree: form.get("degree"), academicYear: form.get("academicYear"), studentId: form.get("studentId"),
    linkedinUrl: form.get("linkedinUrl"), portfolioUrl: form.get("portfolioUrl"), behanceUrl: form.get("behanceUrl"), figmaUrl: form.get("figmaUrl"),
    undergraduateConfirmed: form.get("undergraduateConfirmed") === "true", rulesAccepted: form.get("rulesAccepted") === "true", privacyAccepted: form.get("privacyAccepted") === "true",
    teamName: form.get("teamName"), teamSize: form.get("teamSize"), inviteCode: form.get("inviteCode")
  };
  const schema = mode === "solo" ? soloRegistrationSchema : mode === "create_team" ? teamCreationSchema : mode === "join_team" ? teamJoinSchema : null;
  if (!schema) return NextResponse.json({ error: "Invalid registration mode." }, { status: 400 });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the registration fields." }, { status: 400 });

  const supabase = await createClient();
  const { data: currentAuth } = await supabase.auth.getUser();
  let user = currentAuth.user;
  if (!user) {
    const { data: anonymousAuth, error: anonymousError } = await supabase.auth.signInAnonymously({
      options: { data: { full_name: parsed.data.fullName } }
    });
    if (anonymousError || !anonymousAuth.user) {
      return NextResponse.json({ error: "A secure registration session could not be started. Please try again." }, { status: 503 });
    }
    user = anonymousAuth.user;
  }

  const documentPath = String(form.get("studentIdDocumentPath") ?? "");
  const rawProfilePath = String(form.get("profileImagePath") ?? "");
  const profilePath = rawProfilePath || null;
  if (!isOwnedPath(documentPath, user.id, "png|jpg|jpeg|pdf")) {
    return NextResponse.json({ error: "The university ID upload is missing or invalid." }, { status: 400 });
  }
  if (profilePath && !isOwnedPath(profilePath, user.id, "png|jpg|jpeg|webp")) {
    return NextResponse.json({ error: "The profile image upload is invalid." }, { status: 400 });
  }

  const documentName = documentPath.slice(user.id.length + 1);
  const profileName = profilePath?.slice(user.id.length + 1);
  const [{ data: documentObjects }, profileObjects] = await Promise.all([
    supabase.storage.from("student-ids").list(user.id, { limit: 10, search: documentName }),
    profileName ? supabase.storage.from("profile-images").list(user.id, { limit: 10, search: profileName }) : Promise.resolve({ data: null, error: null })
  ]);
  if (!documentObjects?.some((object) => object.name === documentName)) return NextResponse.json({ error: "The university ID upload could not be verified." }, { status: 400 });
  if (profileName && !profileObjects.data?.some((object) => object.name === profileName)) return NextResponse.json({ error: "The profile image upload could not be verified." }, { status: 400 });

  const { data: existingRegistration } = await supabase.from("registrations").select("id").eq("participant_id", user.id).maybeSingle();
  if (existingRegistration) return NextResponse.json({ error: "This participant is already registered." }, { status: 409 });

  const profile = parsed.data;
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id, auth_user_id: user.id, full_name: profile.fullName, email: profile.email.toLowerCase(), phone: profile.phone,
    university: profile.university, faculty: profile.faculty, degree: profile.degree, academic_year: profile.academicYear,
    student_id: profile.studentId, student_id_document: documentPath, profile_image: profilePath,
    linkedin_url: profile.linkedinUrl || null, portfolio_url: profile.portfolioUrl || null, behance_url: profile.behanceUrl || null, figma_url: profile.figmaUrl || null
  } as never, { onConflict: "id" });
  if (profileError) {
    const cleanup = [supabase.storage.from("student-ids").remove([documentPath])];
    if (profilePath) cleanup.push(supabase.storage.from("profile-images").remove([profilePath]));
    await Promise.allSettled(cleanup);
    return NextResponse.json({ error: profileError.code === "23505" ? "This email address is already registered." : "Your participant profile could not be saved." }, { status: profileError.code === "23505" ? 409 : 400 });
  }

  const rpcPayload = { undergraduate_confirmed: true, rules_accepted: true, privacy_accepted: true, team_name: "teamName" in profile ? profile.teamName : undefined, expected_size: "teamSize" in profile ? profile.teamSize : undefined };
  const result = mode === "solo"
    ? await supabase.rpc("register_solo", { payload: rpcPayload })
    : mode === "create_team"
      ? await supabase.rpc("create_team_and_register", { payload: rpcPayload })
      : await supabase.rpc("join_team_by_code", { invite_code: "inviteCode" in profile ? profile.inviteCode : "" });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: result.error.code === "23505" ? 409 : 400 });
  const data = result.data as { participant_code?: string; team_code?: string } | null;
  after(() => sendCreateXEmail({ to: profile.email, subject: "You have entered CreateX 3.0", title: mode === "create_team" ? "YOUR ALLIANCE HAS BEEN FORMED" : "YOU HAVE ENTERED THE REALM", message: `Your CreateX identity is ${data?.participant_code ?? "being prepared"}. Eligibility review is the next step.${data?.team_code ? ` Your alliance code is ${data.team_code}.` : ""}`, action: { label: "OPEN DASHBOARD", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard` } }).catch(() => undefined));
  return NextResponse.json({ participantCode: data?.participant_code, teamCode: data?.team_code });
}
