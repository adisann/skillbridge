import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const MAX_NAME = 120;

/** Ganti nama tampilan CV tersimpan milik pengguna (berkas di penyimpanan tidak berubah). */
export async function PATCH(req: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Silakan login." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const resumeId = typeof body?.resumeId === "string" ? body.resumeId : "";
  const filename = typeof body?.filename === "string" ? body.filename.replace(/\s+/g, " ").trim() : "";
  if (!resumeId || !filename) {
    return NextResponse.json({ error: "Nama CV tidak boleh kosong." }, { status: 400 });
  }
  if (filename.length > MAX_NAME) {
    return NextResponse.json({ error: `Nama CV maksimal ${MAX_NAME} karakter.` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("resumes")
    .update({ filename })
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .select("id");
  if (error) return NextResponse.json({ error: "Gagal mengganti nama CV." }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "CV tidak ditemukan." }, { status: 404 });

  return NextResponse.json({ success: true, filename });
}
