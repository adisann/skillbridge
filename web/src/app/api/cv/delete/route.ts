import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { deleteFromR2, ownedResumeKey } from "@/lib/r2";
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
    const resumeId = typeof body?.resumeId === "string" ? body.resumeId : undefined;
    const effectiveUserId = user.id;

    // 1. Key R2 hanya diambil dari baris resume milik pengguna (RLS), tidak dari input klien.
    let findQuery = supabase.from("resumes").select("file_url").eq("user_id", effectiveUserId);
    if (resumeId) {
      findQuery = findQuery.eq("id", resumeId);
    }
    const { data: foundResumes, error: findError } = await findQuery;
    if (findError) {
      throw new Error("Gagal memuat CV yang akan dihapus. Coba lagi.");
    }
    if (resumeId && !foundResumes?.length) {
      return NextResponse.json({ error: "CV tidak ditemukan di akun ini." }, { status: 404 });
    }
    const keysToDelete = (foundResumes || [])
      .map((r: { file_url: string | null }) => ownedResumeKey(effectiveUserId, r.file_url))
      .filter((k: string | null): k is string => Boolean(k));

    // 2. Hapus berkas fisik dari R2. Bila gagal, hentikan agar data tidak setengah terhapus.
    for (const key of keysToDelete) {
      const deleted = await deleteFromR2(key);
      if (!deleted) {
        return NextResponse.json(
          { error: "Berkas CV belum berhasil dihapus dari penyimpanan. Coba lagi beberapa saat." },
          { status: 502 }
        );
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
