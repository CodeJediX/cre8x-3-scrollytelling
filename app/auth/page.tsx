import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { AuthPanel } from "@/components/auth-panel";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function AuthPage() {
  return <main className="platform-page auth-page"><AppNav /><div className="auth-visual" /><Suspense fallback={<div className="auth-panel glass-panel">Initializing identity gateway…</div>}><AuthPanel configured={hasSupabaseEnv()} /></Suspense></main>;
}
