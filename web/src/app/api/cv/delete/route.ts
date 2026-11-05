import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/r2";
import { clearCvAnalysisCache } from "@/lib/ai/cache";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk menghapus CV." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { resumeId, r2Key } = body;
    const effectiveUserId = user.id;

    // 1. Ambil data resume aktif untuk mengecek r2Key bila tidak disertakan klien
    let targetR2Key = r2Key;
    if (!targetR2Key) {
      let findQuery = supabase.from("resumes").select("file_url").eq("user_id", effectiveUserId);
      if (resumeId) {
        findQuery = findQuery.eq("id", resumeId);
      }
      const { data: foundResume } = await findQuery.limit(1);
      if (foundResume && foundResume.length > 0 && foundResume[0].file_url) {
        const urlStr = foundResume[0].file_url;
        if (urlStr.startsWith("r2://")) {
          targetR2Key = urlStr.replace("r2://", "");
        } else if (urlStr.includes("resumes/")) {
          const match = urlStr.match(/resumes\/[^?&]+/);
          if (match) targetR2Key = match[0];
        }
      }
    }

    // 2. Hapus berkas fisik dari Cloudflare R2 bucket privat (NFR-02)
    if (targetR2Key) {
      try {
        await deleteFromR2(targetR2Key);
      } catch (r2Err) {
        console.warn("[CV Delete] Peringatan saat menghapus objek R2:", r2Err);
      }
    }

    // 3. Bersihkan seluruh cache analisis AI terkait CV pengguna
    try {
      await clearCvAnalysisCache(effectiveUserId);
    } catch (cacheErr) {
      console.warn("[CV Delete] Peringatan saat menghapus cache AI:", cacheErr);
    }

    // 4. Hapus dari tabel `resumes` milik user aktif (RLS enforced)
    let deleteQuery = supabase.from("resumes").delete().eq("user_id", effectiveUserId);
    if (resumeId) {
      deleteQuery = deleteQuery.eq("id", resumeId);
    }

    const { error: dbErr } = await deleteQuery;
    if (dbErr) {
      throw new Error("Gagal menghapus resume dari database: " + dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Dokumen CV, file privat R2, cache analisis AI, dan seluruh kalkulasi kecocokan berhasil dihapus secara permanen.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menghapus dokumen: " + (err.message || "Kesalahan internal") },
      { status: 500 }
    );
  }
}
