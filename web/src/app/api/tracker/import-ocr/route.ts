import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { extractJobFromImage } from "@/lib/ai/extractor";
import { enforceRateLimits } from "@/lib/rate-limit";
import { trackerOcrRules } from "@/lib/rate-limit-policies";

export const maxDuration = 30;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
// Nilai cadangan lama extractor saat informasi tidak tertulis; jangan diisikan ke form pengguna
const PLACEHOLDER_COMPANY = "Perusahaan Terverifikasi";

/**
 * Baca screenshot / poster lowongan untuk form "Tambah Lowongan" di job tracker.
 * Khusus pengguna yang login. Hanya mengembalikan field yang ada di form tracker,
 * dan tidak menyimpan apa pun ke katalog lowongan.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Masuk dulu untuk memakai fitur ini." }, { status: 401 });
    }

    const limited = await enforceRateLimits(trackerOcrRules(user.id));
    if (limited) return limited;

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Pilih screenshot atau poster lowongan dulu." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 10 MB." }, { status: 400 });
    }
    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Format belum didukung. Gunakan gambar JPG, PNG, WEBP, atau PDF." },
        { status: 400 }
      );
    }

    const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const extracted = await extractJobFromImage(base64Data, mimeType, file.name, { requireDescription: false });

    const company = (extracted.company || "").trim();
    return NextResponse.json({
      job: {
        title: (extracted.title || "").trim(),
        company: company === PLACEHOLDER_COMPANY ? "" : company,
        location: (extracted.location || "").trim(),
        employmentType: (extracted.employmentType || "").trim(),
      },
    });
  } catch (err: unknown) {
    console.error("[Tracker OCR Error]:", err);
    return NextResponse.json(
      { error: "Screenshot belum bisa dibaca. Coba gambar yang lebih jelas atau isi manual." },
      { status: 500 }
    );
  }
}
