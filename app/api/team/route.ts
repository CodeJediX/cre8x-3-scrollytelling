import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const actionSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("leave") }), z.object({ action: z.literal("remove"), memberId: z.uuid() })]);

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid team action." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const result = parsed.data.action === "leave" ? await supabase.rpc("leave_current_team") : await supabase.rpc("remove_team_member", { member_user_id: parsed.data.memberId });
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json(result.data);
}
