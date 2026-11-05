import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteFromR2 } from "@/lib/r2";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, resumeId, r2Key } = body;

    const effectiveUserId = userId || "00000000-0000-0000-0000-000000000001";
    const supabase = getServiceSupabase();

    // 1. Hapus dari Cloudflare R2 jika r2Key ada
    if (r2Key) {
      await deleteFromR2(r2Key);
    }

    // 2. Hapus dari tabel `resumes` (otomatis cascading delete ke resume_skills dan matches)
    let query = supabase.from("resumes").delete();
    if (resumeId) {
      query = query.eq("id", resumeId);
    } else {
      query = query.eq("user_id", effectiveUserId);
    }

    const { error: dbErr } = await query;
    if (dbErr) {
      throw new Error("Gagal menghapus resume dari database: " + dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Dokumen CV, hasil ekstraksi, dan seluruh kalkulasi kecocokan berhasil dihapus secara permanen dari server dan penyimpanan privat.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menghapus dokumen: " + (err.message || "Kesalahan internal") },
      { status: 500 }
    );
  }
}
