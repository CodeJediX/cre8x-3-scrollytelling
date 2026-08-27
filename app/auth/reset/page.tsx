"use client";

import { useState } from "react";
import { AppNav } from "@/components/app-nav";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  async function update(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const { error } = await createClient().auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated. You can now sign in.");
  }
  return <main className="platform-page auth-page"><AppNav /><div className="auth-panel glass-panel"><span className="platform-kicker">SECURE RECOVERY</span><h1>Set a new access key.</h1><form action={update}><div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={8} required /></div>{message && <div className="form-notice">{message}</div>}<button className="primary-action">UPDATE PASSWORD</button></form></div></main>;
}
