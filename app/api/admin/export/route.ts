import { NextResponse } from "next/server";
import { getAdminData, isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isAdmin(auth.user.id))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const data = await getAdminData(); const rows = [["CreateX ID", "Name", "Email", "University", "Type", "Eligibility", "Status", "Created"], ...data.participants.map((item) => [item.code, item.name, item.email, item.university, item.type, item.eligibility, item.status, item.createdAt])];
  return new Response(rows.map((row) => row.map(csv).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="createx-participants-${new Date().toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" } });
}
