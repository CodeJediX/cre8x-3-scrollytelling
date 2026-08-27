import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function PATCH(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsed = z.object({ id: z.uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { error } = await supabase.from("notifications").update({ read: true } as never).eq("id", parsed.data.id).eq("user_id", auth.user.id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ read: true });
}
