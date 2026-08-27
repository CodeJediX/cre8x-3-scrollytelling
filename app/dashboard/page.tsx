import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { DashboardShell } from "@/components/dashboard-shell";
import { demoDashboard, getDashboardData } from "@/lib/dashboard";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  let data = demoDashboard;
  let authenticated = false;
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/auth?next=/dashboard");
    authenticated = true;
    data = await getDashboardData(auth.user.id);
  }
  return <main className="platform-page dashboard-page"><AppNav authenticated={authenticated} /><DashboardShell data={data} /></main>;
}
