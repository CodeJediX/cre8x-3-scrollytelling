"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Bell, Check, Clipboard, FileUp, LockKeyhole, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import type { DashboardData } from "@/lib/types";

const labels: Record<string, string> = { pending_email_verification: "Email verification", pending_eligibility_review: "Eligibility review", registered: "Registered", rejected: "Rejected", pending: "Pending", eligible: "Eligible" };

export function DashboardShell({ data }: { data: DashboardData }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState(data.notifications);
  const openRound = data.rounds.find((round) => round.status === "open" && round.round_slug !== "registration");
  const submission = useMemo(() => data.submissions.find((item) => item.roundId === openRound?.id), [data.submissions, openRound]);

  async function copyCode() {
    if (!data.team) return;
    await navigator.clipboard.writeText(data.team.code);
    setNotice("Alliance invite code copied.");
  }
  async function mutateTeam(action: "leave" | "remove", memberId?: string) {
    setBusy(true); setNotice("");
    const response = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, memberId }) });
    const result = await response.json();
    setNotice(response.ok ? "Alliance updated." : result.error ?? "The alliance could not be updated.");
    setBusy(false); if (response.ok) window.location.reload();
  }
  async function markRead(id: string) {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return <div className="dashboard-shell">
    {data.previewMode && <div className="preview-banner">Interactive preview · connect Supabase to replace sample data</div>}
    <header className="dashboard-hero">
      <div><span className="platform-kicker">Participant command</span><h1>Welcome, <em>{data.profile.fullName.split(" ")[0]}</em></h1><p>{data.registration ? "Your passage through CreateX 3.0 is active." : "Complete registration to enter the competition realm."}</p></div>
      <div className="identity-sigil glass-panel"><UserRound /><small>CreateX identity</small><strong>{data.registration?.participantCode ?? "NOT REGISTERED"}</strong><span>{data.profile.university ?? "University pending"}</span></div>
    </header>

    <section className="stage-track glass-panel" aria-label="Competition progress">
      {data.rounds.map((round, index) => <article className={round.status === "open" ? "is-active" : round.status === "completed" ? "is-complete" : "is-locked"} key={round.id}>
        <span>{String(index + 1).padStart(2, "0")}</span><i>{round.status === "coming_soon" ? <LockKeyhole /> : <Check />}</i><div><small>{round.status.replace("_", " ")}</small><b>{round.round_name}</b></div>
      </article>)}
    </section>

    {notice && <div className="form-notice">{notice}</div>}
    <div className="dashboard-grid">
      <section className="dashboard-card glass-panel status-card"><span className="card-index">01 / STATUS</span><ShieldCheck /><h2>Eligibility</h2><div className="status-lines"><p><span>Registration</span><b>{labels[data.registration?.status ?? ""] ?? "Incomplete"}</b></p><p><span>Undergraduate review</span><b>{labels[data.registration?.eligibility ?? ""] ?? "Pending"}</b></p><p><span>Contact email</span><b>Collected</b></p></div>{!data.registration && <Link className="primary-action" href="/register">Register now</Link>}</section>

      <section className="dashboard-card glass-panel team-card"><span className="card-index">02 / ALLIANCE</span><UsersRound /><h2>{data.team?.name ?? "Solo passage"}</h2>{data.team ? <><button className="invite-code" onClick={copyCode}><span>{data.team.code}</span><Clipboard aria-hidden /></button><div className="member-list">{data.team.members.map((member) => <div key={member.id}><span>{member.name}<small>{member.role}</small></span>{data.team?.isLeader && member.role !== "leader" && !data.teamChangesLocked && <button disabled={busy} onClick={() => mutateTeam("remove", member.id)}>Remove</button>}</div>)}</div>{!data.team.isLeader && !data.teamChangesLocked && <button className="secondary-action" disabled={busy} onClick={() => mutateTeam("leave")}><LogOut /> Leave team</button>}{data.teamChangesLocked && <p className="muted-copy"><LockKeyhole /> Team membership is locked.</p>}</> : <p className="muted-copy">You are registered as a solo participant.</p>}</section>

      <section className="dashboard-card glass-panel notification-card"><span className="card-index">03 / SIGNALS</span><Bell /><h2>Notifications</h2><div className="signal-list">{notifications.length ? notifications.map((item) => <button className={item.read ? "" : "is-unread"} key={item.id} onClick={() => markRead(item.id)}><b>{item.title}</b><span>{item.message}</span></button>) : <p className="empty-oracle">The Oracle is silent — for now.</p>}</div></section>

      <section className="dashboard-card glass-panel submission-card"><span className="card-index">04 / VISION</span><FileUp /><h2>{openRound?.round_name ?? "Submission vault"}</h2>{openRound ? <SubmissionEditor roundId={openRound.id} initial={submission} /> : <div className="locked-state"><LockKeyhole /><strong>Your vision awaits.</strong><p>Submission controls will unlock automatically when the Oracle Challenge opens.</p></div>}</section>
    </div>

    {data.pass && data.registration?.status === "registered" && <section className="digital-pass glass-panel"><div><span className="platform-kicker">Approved participant pass</span><h2>{data.profile.fullName}</h2><p>{data.registration.participantCode} · {data.team?.name ?? "Solo"}</p></div><Image className="pass-qr" src="/api/pass/qr" width={126} height={126} unoptimized alt="CreateX participant check-in QR code" /><div className="pass-token"><span>Secure token</span><code>{data.pass.token.slice(0, 8)}••••</code><small>{data.pass.checkedIn ? `Checked in ${data.pass.checkedInAt ? new Date(data.pass.checkedInAt).toLocaleString() : ""}` : "Ready for organizer scan"}</small></div></section>}
    <button className="dashboard-logout" onClick={logout}>Log out</button>
  </div>;
}

function SubmissionEditor({ roundId, initial }: { roundId: string; initial?: DashboardData["submissions"][number] }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(event.currentTarget); form.set("roundId", roundId);
    const response = await fetch("/api/submissions", { method: "POST", body: form }); const result = await response.json();
    setMessage(response.ok ? form.get("intent") === "submitted" ? "Your vision has been recorded." : "Draft secured." : result.error ?? "Submission failed."); setBusy(false);
  }
  return <form className="submission-editor" onSubmit={save}><div className="field"><label htmlFor="projectTitle">Project title</label><input id="projectTitle" name="title" defaultValue={initial?.title} required minLength={2} maxLength={180} /></div><div className="field"><label htmlFor="projectDescription">Vision summary</label><textarea id="projectDescription" name="description" defaultValue={initial?.description ?? ""} /></div><div className="field-grid"><div className="field"><label htmlFor="figmaUrl">Figma URL</label><input id="figmaUrl" name="figmaUrl" type="url" defaultValue={initial?.figmaUrl ?? ""} /></div><div className="field"><label htmlFor="prototypeUrl">Prototype URL</label><input id="prototypeUrl" name="prototypeUrl" type="url" defaultValue={initial?.prototypeUrl ?? ""} /></div></div><div className="field"><label htmlFor="supportingUrl">Supporting URL</label><input id="supportingUrl" name="supportingUrl" type="url" defaultValue={initial?.supportingUrl ?? ""} /></div><div className="field"><label htmlFor="submissionFile">Supporting PDF / ZIP</label><input id="submissionFile" name="submissionFile" type="file" accept=".pdf,.zip,image/png,image/jpeg" /></div>{message && <div className="form-notice">{message}</div>}<div className="submission-actions"><button className="secondary-action" name="intent" value="draft" disabled={busy}>Save draft</button><button className="primary-action" name="intent" value="submitted" disabled={busy}>Submit vision</button></div></form>;
}
