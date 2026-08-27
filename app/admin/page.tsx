import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AdminConsole } from "@/components/admin-console";
import { getAdminData, isAdmin } from "@/lib/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  if (!hasSupabaseEnv()) return <main className="platform-page admin-page"><AppNav /><div className="admin-setup glass-panel"><span className="platform-kicker">Secure admin realm</span><h1>Supabase connection required</h1><p>The admin console intentionally has no fake control mode. Apply the migration, add an authorized user to <code>admin_users</code>, and configure the publishable environment values.</p></div></main>;
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth?next=/admin");
  if (!(await isAdmin(auth.user.id))) return <main className="platform-page admin-page"><AppNav authenticated /><div className="admin-setup glass-panel"><span className="platform-kicker">Access denied</span><h1>Olympus is restricted.</h1><p>Your authenticated account does not have a protected admin role.</p></div></main>;
  return <main className="platform-page admin-page"><AppNav authenticated admin /><AdminConsole data={await getAdminData()} /></main>;
}
