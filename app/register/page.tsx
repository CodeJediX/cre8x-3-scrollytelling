import { AppNav } from "@/components/app-nav";
import { RegistrationFlow } from "@/components/registration-flow";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const configured = hasSupabaseEnv();
  let authenticated = false;
  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authenticated = Boolean(data.user);
  }
  return <main className="platform-page registration-page"><AppNav authenticated={authenticated} /><div className="registration-backdrop" /><div className="platform-shell"><RegistrationFlow configured={configured} /></div></main>;
}
