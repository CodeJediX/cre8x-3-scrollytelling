"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

export function AuthPanel({ configured }: { configured: boolean }) {
  const search = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>((search.get("mode") as Mode) || "login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true); setError(""); setMessage("");
    if (!configured) { setError("Supabase is not connected yet. Add the project values from .env.example to enable authentication."); setPending(false); return; }
    try {
      const supabase = createClient();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      if (mode === "signup") {
        const fullName = String(formData.get("fullName") ?? "").trim();
        const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${location.origin}/auth/callback?next=/register` } });
        if (authError) throw authError;
        setMessage("Verification signal sent. Open your email, verify the account, then return to enter the competition.");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/auth/reset` });
        if (authError) throw authError;
        setMessage("Password recovery instructions have been sent.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push(search.get("next") || "/dashboard"); router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally { setPending(false); }
  }

  return (
    <div className="auth-panel glass-panel">
      <span className="platform-kicker">IDENTITY GATEWAY</span>
      <h1>{mode === "signup" ? "Enter the realm." : mode === "forgot" ? "Recover your signal." : "Return to Olympus."}</h1>
      <p>{mode === "signup" ? "Create your verified CreateX identity before registering solo or with a team." : mode === "forgot" ? "We will send a secure recovery link to your verified email." : "Sign in to manage your registration, team and submissions."}</p>
      <form action={submit}>
        {mode === "signup" && <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" required autoComplete="name" /></div>}
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
        {mode !== "forgot" && <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>}
        {error && <div className="form-notice error" role="alert">{error}</div>}
        {message && <div className="form-notice success" role="status">{message}</div>}
        <button className="primary-action" disabled={pending}>{pending ? "TRANSMITTING…" : mode === "signup" ? "CREATE ACCOUNT" : mode === "forgot" ? "SEND RECOVERY LINK" : "SIGN IN"}</button>
      </form>
      <div className="auth-switches">
        {mode !== "login" && <button onClick={() => setMode("login")}>Already registered? Sign in</button>}
        {mode !== "signup" && <button onClick={() => setMode("signup")}>Create account</button>}
        {mode !== "forgot" && <button onClick={() => setMode("forgot")}>Forgot password?</button>}
      </div>
      <Link href="/">← Return to the experience</Link>
    </div>
  );
}
