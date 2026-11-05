import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/supabase/server";
import { extractJobFromImage } from "@/lib/ai/extractor";

export const maxDuration = 30; // 30 seconds max duration

export async function POST(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File gambar/poster lowongan kerja wajib diunggah." }, { status: 400 });
    }

    // Validasi ukuran file (maksimal 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 10 MB." }, { status: 400 });
    }

    // Validasi tipe mime
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    const mimeType = file.type || "image/jpeg";
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah gambar JPG, PNG, WEBP, atau file PDF." },
        { status: 400 }
      );
    }

    // Baca file sebagai ArrayBuffer lalu konversi ke Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Panggil Multi-Tier OCR (Gemini Vision -> Groq Vision -> LlamaParse)
    const extracted = await extractJobFromImage(base64Data, mimeType, file.name);

    return NextResponse.json({
      success: true,
      message: `OCR berhasil membaca flyer "${file.name}" dan mengekstrak data lowongan.`,
      job: extracted,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin Import OCR Error]:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses OCR gambar lowongan." },
      { status: 500 }
    );
  }
}

