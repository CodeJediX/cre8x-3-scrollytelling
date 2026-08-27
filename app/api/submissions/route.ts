import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const schema = z.object({ roundId: z.uuid(), title: z.string().trim().min(2).max(180), description: z.string().max(4000).optional(), figmaUrl: z.url().or(z.literal("")).optional(), prototypeUrl: z.url().or(z.literal("")).optional(), supportingUrl: z.url().or(z.literal("")).optional(), intent: z.enum(["draft", "submitted"]) });
const allowed = new Set(["application/pdf", "application/zip", "image/png", "image/jpeg"]);

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Connect Supabase before saving submissions." }, { status: 503 });
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(["roundId", "title", "description", "figmaUrl", "prototypeUrl", "supportingUrl", "intent"].map((key) => [key, String(form.get(key) ?? "")])));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the submission fields." }, { status: 400 });
  let documentUrl: string | null = null; const file = form.get("submissionFile");
  if (file instanceof File && file.size > 0) {
    if (file.size > 20_000_000 || !allowed.has(file.type)) return NextResponse.json({ error: "Supporting files must be PDF, ZIP, PNG or JPEG under 20 MB." }, { status: 400 });
    const suffix = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin"; documentUrl = `${auth.user.id}/${parsed.data.roundId}/${crypto.randomUUID()}.${suffix}`;
    const { error: uploadError } = await supabase.storage.from("pretask-submissions").upload(documentUrl, file, { contentType: file.type });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("upsert_round_submission", { payload: { round_id: parsed.data.roundId, title: parsed.data.title, description: parsed.data.description || null, figma_url: parsed.data.figmaUrl || null, prototype_url: parsed.data.prototypeUrl || null, supporting_url: parsed.data.supportingUrl || null, document_url: documentUrl, status: parsed.data.intent } });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}
