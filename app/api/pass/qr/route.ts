import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Authentication required", { status: 401 });
  const { data } = await supabase.from("checkins").select("pass_token").eq("participant_id", auth.user.id).maybeSingle();
  if (!data) return new Response("Pass unavailable", { status: 404 });
  const token = String((data as { pass_token: string }).pass_token);
  const svg = await QRCode.toString(`CRX3:${token}`, { type: "svg", margin: 1, color: { dark: "#080808", light: "#f5d85c" }, errorCorrectionLevel: "H" });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } });
}
