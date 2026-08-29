"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, User, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "choose" | "solo" | "team_choice" | "create_team" | "join_team";

const idFileTypes: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "application/pdf": "pdf" };
const profileFileTypes: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

const baseFields = [
  ["fullName", "Full name", "text", true], ["email", "Email", "email", true], ["phone", "Mobile number", "tel", true],
  ["university", "University", "text", true], ["faculty", "Faculty", "text", true], ["degree", "Degree programme", "text", true],
  ["academicYear", "Academic year", "text", true], ["studentId", "Student ID", "text", true],
  ["linkedinUrl", "LinkedIn URL · optional", "url", false], ["portfolioUrl", "Portfolio URL · optional", "url", false],
  ["behanceUrl", "Behance URL · optional", "url", false], ["figmaUrl", "Figma profile URL · optional", "url", false]
] as const;

export function RegistrationFlow({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<Mode>("choose");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ title: string; code?: string; teamCode?: string } | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [mode, success]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    if (!configured) { setError("Registration preview is ready, but a CREA8X Supabase project must be connected before records can be saved."); setPending(false); return; }
    const formData = new FormData(event.currentTarget); formData.set("mode", mode);
    const idDocument = formData.get("studentIdDocument");
    const profileImage = formData.get("profileImage");
    const uploaded: Array<{ bucket: "student-ids" | "profile-images"; path: string }> = [];
    try {
      if (!(idDocument instanceof File) || idDocument.size === 0 || idDocument.size > 5_000_000 || !idFileTypes[idDocument.type]) {
        throw new Error("Upload a PNG, JPEG or PDF university ID under 5 MB.");
      }
      if (profileImage instanceof File && profileImage.size > 0 && (profileImage.size > 3_000_000 || !profileFileTypes[profileImage.type])) {
        throw new Error("Profile images must be PNG, JPEG or WebP under 3 MB.");
      }

      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const fullName = String(formData.get("fullName") ?? "").trim();
        const { data, error: anonymousError } = await supabase.auth.signInAnonymously({ options: { data: { full_name: fullName } } });
        if (anonymousError || !data.user) throw new Error("A secure registration session could not be started. Please try again.");
        user = data.user;
      }

      const documentPath = `${user.id}/${crypto.randomUUID()}.${idFileTypes[idDocument.type]}`;
      const { error: documentError } = await supabase.storage.from("student-ids").upload(documentPath, idDocument, { contentType: idDocument.type, upsert: false });
      if (documentError) throw new Error(`University ID upload failed: ${documentError.message}`);
      uploaded.push({ bucket: "student-ids", path: documentPath });
      formData.set("studentIdDocumentPath", documentPath);

      if (profileImage instanceof File && profileImage.size > 0) {
        const profilePath = `${user.id}/${crypto.randomUUID()}.${profileFileTypes[profileImage.type]}`;
        const { error: profileError } = await supabase.storage.from("profile-images").upload(profilePath, profileImage, { contentType: profileImage.type, upsert: false });
        if (profileError) throw new Error(`Profile image upload failed: ${profileError.message}`);
        uploaded.push({ bucket: "profile-images", path: profilePath });
        formData.set("profileImagePath", profilePath);
      }

      formData.delete("studentIdDocument");
      formData.delete("profileImage");
      const response = await fetch("/api/register", { method: "POST", body: formData });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await response.json()
        : { error: response.status === 413 ? "The selected files are too large to submit." : (await response.text()).trim() || "The registration server returned an unexpected response." };
      if (!response.ok) throw new Error(body.error || "Registration failed");
      setSuccess({ title: mode === "create_team" ? "YOUR ALLIANCE HAS BEEN FORMED" : mode === "join_team" ? "YOU HAVE JOINED THE ALLIANCE" : "YOU HAVE ENTERED THE REALM", code: body.participantCode, teamCode: body.teamCode });
    } catch (cause) {
      if (uploaded.length) {
        const supabase = createClient();
        await Promise.allSettled(uploaded.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])));
      }
      setError(cause instanceof Error ? cause.message : "Registration failed");
    }
    finally { setPending(false); }
  }

  if (success) return <div className="registration-success glass-panel"><span>REGISTRATION SIGNAL CONFIRMED</span><h1>{success.title}</h1>{success.code && <div><small>CREA8X ID</small><b>{success.code}</b></div>}{success.teamCode && <div><small>ALLIANCE INVITE CODE</small><b>{success.teamCode}</b></div>}<p>Your eligibility is now pending review. Keep your invite code private except when sharing it with intended teammates.</p><Link className="primary-action" href="/dashboard">ENTER DASHBOARD <ArrowRight size={15} /></Link></div>;

  if (mode === "choose" || mode === "team_choice") return (
    <div className="registration-choice">
      <span className="platform-kicker">REGISTRATION PROTOCOL</span><h1>{mode === "choose" ? "Choose your path." : "Form or join an alliance."}</h1>
      <p>{mode === "choose" ? "Compete independently or combine perspectives in a team of up to four undergraduates." : "A leader creates the team and shares the generated invite code with members."}</p>
      <div className="choice-grid">
        {mode === "choose" ? <><button onClick={() => setMode("solo")}><User /><span>SOLO</span><small>One designer. One vision.</small></button><button onClick={() => setMode("team_choice")}><Users /><span>TEAM</span><small>Up to four participants.</small></button></> : <><button onClick={() => setMode("create_team")}><Users /><span>CREATE TEAM</span><small>Become the team leader.</small></button><button onClick={() => setMode("join_team")}><ArrowRight /><span>JOIN EXISTING</span><small>Use an alliance invite code.</small></button></>}
      </div>{mode === "team_choice" && <button className="text-back" onClick={() => setMode("choose")}><ArrowLeft size={14} /> Back</button>}
    </div>
  );

  return (
    <form className="registration-form glass-panel" onSubmit={submit}>
      <button type="button" className="text-back" onClick={() => setMode(mode === "solo" ? "choose" : "team_choice")}><ArrowLeft size={14} /> Change path</button>
      <span className="platform-kicker">{mode.replace("_", " ")}</span><h1>{mode === "solo" ? "Register your vision." : mode === "create_team" ? "Form your alliance." : "Join your alliance."}</h1>
      <div className="field-grid">
        {mode === "create_team" && <><div className="field"><label htmlFor="teamName">Team name</label><input id="teamName" name="teamName" required maxLength={100} /></div><div className="field"><label htmlFor="teamSize">Expected team size</label><select id="teamSize" name="teamSize" defaultValue="2"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div></>}
        {mode === "join_team" && <div className="field full"><label htmlFor="inviteCode">Alliance invite code</label><input id="inviteCode" name="inviteCode" required pattern="CRX3-[A-Z0-9]{6}" placeholder="CRX3-X7K92A" /></div>}
        {baseFields.map(([name, label, type, required]) => <div className="field" key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} required={required} autoComplete={name === "email" ? "email" : undefined} /></div>)}
        <p className="field-help full">Your email is collected for competition updates. No account verification or email login is required.</p>
        <div className="field"><label htmlFor="studentIdDocument">Student / university ID document</label><input id="studentIdDocument" name="studentIdDocument" type="file" accept="image/png,image/jpeg,application/pdf" required /></div>
        <div className="field"><label htmlFor="profileImage">Profile image · optional</label><input id="profileImage" name="profileImage" type="file" accept="image/png,image/jpeg,image/webp" /></div>
      </div>
      <div className="consent-stack"><label><input type="checkbox" name="undergraduateConfirmed" value="true" required /> I confirm that I am currently an undergraduate.</label><label><input type="checkbox" name="rulesAccepted" value="true" required /> I agree to the competition rules.</label><label><input type="checkbox" name="privacyAccepted" value="true" required /> I agree to the privacy policy.</label></div>
      {error && <div className="form-notice error" role="alert">{error}</div>}
      <button className="primary-action" disabled={pending}>{pending ? "RECORDING YOUR VISION…" : "CONFIRM REGISTRATION"}</button>
    </form>
  );
}
