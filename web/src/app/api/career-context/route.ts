import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  const [resumes, profile] = await Promise.all([
    supabase.from("resumes").select("id, filename, is_active").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("target_role, target_roles").eq("id", user.id).single(),
  ]);
  if (resumes.error || profile.error) return NextResponse.json({ error: "Gagal memuat konteks CV dan target." }, { status: 500 });
  return NextResponse.json({ resumes: resumes.data, targetRole: profile.data.target_role, targetRoles: profile.data.target_roles }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  const body = await req.json();
  if ((!body.resumeId && !body.targetRole) || (body.targetRole !== undefined && (typeof body.targetRole !== "string" || !body.targetRole.trim() || body.targetRole.length > 150))) {
    return NextResponse.json({ error: "Pilih CV atau isi target karier (maksimal 150 karakter)." }, { status: 400 });
  }
  const { error } = await supabase.rpc("set_career_context", { p_resume_id: body.resumeId || null, p_target_role: body.targetRole?.trim() || null });
  if (error) return NextResponse.json({ error: "Gagal mengganti konteks. Pastikan CV milik akun ini." }, { status: 400 });
  return NextResponse.json({ success: true });
}
