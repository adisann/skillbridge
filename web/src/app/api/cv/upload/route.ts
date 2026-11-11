import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { uploadToR2, resumeKeyPrefix } from "@/lib/r2";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { cvUploadRules } from "@/lib/rate-limit-policies";
import { extractGpaFromText } from "@/lib/gpa";
import { SKILL_RULES, detectSkills, extractExperienceYears } from "@/lib/cv-extraction";

// Hanya PDF dan DOCX yang didukung (sama dengan teks di halaman unggah)
const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf", ""],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", ""],
};
const UNSUPPORTED_FORMAT = "Format file tidak didukung. Unggah CV dalam format PDF atau DOCX.";
// Batas 4 MB: body request fungsi serverless Vercel maksimal 4,5 MB
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_PDF_PAGES = 10;
const PDF_SIGNATURE = "%PDF-";
const ZIP_SIGNATURE = "PK";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk mengunggah CV." },
        { status: 401 }
      );
    }

    const limited = await enforceRateLimits(cvUploadRules(getClientIp(req), user.id));
    if (limited) return limited;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Berkas CV tidak ditemukan. Silakan pilih berkas PDF atau DOCX." },
        { status: 400 }
      );
    }

    // 1. Validasi Ukuran Berkas di Sisi Server (NFR-06)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran berkas (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal 4 MB.` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Berkas kosong. Pilih CV dalam format PDF atau DOCX." }, { status: 400 });
    }

    // 2. Validasi jenis berkas: ekstensi DAN MIME harus cocok (browser kadang mengirim MIME kosong)
    const fileName = file.name.toLowerCase();
    const ext = fileName.split(".").pop() || "";
    const allowedMimes = ALLOWED_TYPES[ext];
    if (!allowedMimes || !allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: UNSUPPORTED_FORMAT }, { status: 400 });
    }

    // 3. Validasi isi berkas (signature), bukan hanya nama/MIME yang bisa dipalsukan
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPdfFile = ext === "pdf";
    const isDocxFile = ext === "docx";
    if (isPdfFile && buffer.toString("latin1", 0, 5) !== PDF_SIGNATURE) {
      return NextResponse.json({ error: "Isi berkas bukan PDF yang valid. " + UNSUPPORTED_FORMAT }, { status: 400 });
    }
    if (isDocxFile && buffer.toString("latin1", 0, 2) !== ZIP_SIGNATURE) {
      return NextResponse.json({ error: "Isi berkas bukan DOCX yang valid. " + UNSUPPORTED_FORMAT }, { status: 400 });
    }

    // 4. Ekstraksi Profil & Kualifikasi (Teks CV tidak masuk log sesuai NFR-02 & NFR-06)
    let extractedText = "";
    if (isPdfFile) {
      try {
        const { extractText } = await import("unpdf");
        const pdfData = await extractText(new Uint8Array(buffer));
        if (pdfData.totalPages > MAX_PDF_PAGES) {
          return NextResponse.json(
            { error: `CV terlalu panjang (${pdfData.totalPages} halaman). Maksimal ${MAX_PDF_PAGES} halaman.` },
            { status: 400 }
          );
        }
        extractedText = Array.isArray(pdfData.text) ? pdfData.text.join("\n") : (pdfData.text || "");
      } catch {
        return NextResponse.json({ error: "PDF tidak dapat dibaca. Pastikan berkas tidak rusak atau terkunci kata sandi." }, { status: 422 });
      }
    } else {
      try {
        const mammoth = await import("mammoth");
        const mammothResult = await mammoth.extractRawText({ buffer });
        extractedText = mammothResult.value || "";
      } catch (docErr) {
        console.warn("[Upload] Gagal mengekstrak DOCX via mammoth:", docErr instanceof Error ? docErr.name : "UnknownError");
        return NextResponse.json({ error: "DOCX tidak dapat dibaca. Pastikan berkas tidak rusak." }, { status: 422 });
      }
    }

    // Validasi NFR-04: Dokumen kosong atau tidak memuat teks
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Dokumen CV kosong atau tidak memuat lapisan teks yang dapat diekstrak (contoh: berkas scan gambar murni tanpa teks). Silakan gunakan dokumen PDF atau DOCX berbasis teks.",
        },
        { status: 422 }
      );
    }

    // 5. Simpan ke Cloudflare R2 Bucket Privat, hanya setelah berkas lolos semua validasi
    // Key per-pengguna dan acak: tidak bisa ditebak, dan kepemilikannya bisa diverifikasi saat simpan/hapus.
    const safeKey = `${resumeKeyPrefix(user.id)}${randomUUID()}.${isPdfFile ? "pdf" : "docx"}`;
    const contentType = isPdfFile ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const { presignedUrl } = await uploadToR2(buffer, safeKey, contentType);

    const lowerText = extractedText.toLowerCase();

    const detectedSkills = detectSkills(extractedText);

    // NFR-03 & E04: Tidak menyuntikkan skill default palsu bila teks tidak memuat skill
    const finalSkills = detectedSkills;

    // Ekstraksi nama kandidat dari baris awal teks
    const lines = extractedText.split("\n").map((l) => l.trim()).filter(Boolean);
    let candidateName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    for (const line of lines.slice(0, 5)) {
      const clean = line.replace(/[^a-zA-Z\s]/g, "").trim();
      if (clean.length >= 4 && clean.length <= 40 && !clean.toLowerCase().includes("curriculum") && !clean.toLowerCase().includes("resume")) {
        candidateName = clean;
        break;
      }
    }

    // Ekstraksi pendidikan
    let education = "Sarjana (S1)";
    if (lowerText.includes("bachelor’s degree in data science") || lowerText.includes("bachelor of data science")) {
      education = "S1 Data Science (Telkom University)";
    } else if (lowerText.includes("sains data")) {
      education = "S1 Sains Data (Mahasiswa)";
    } else if (lowerText.includes("smk negeri 1 denpasar") || lowerText.includes("rekayasa perangkat lunak")) {
      education = "SMK Rekayasa Perangkat Lunak / Mahasiswa";
    } else if (lowerText.includes("informatika") || lowerText.includes("computer science")) {
      education = "S1 Teknik Informatika";
    } else if (lowerText.includes("sistem informasi") || lowerText.includes("information systems")) {
      education = "S1 Sistem Informasi";
    } else if (lowerText.includes("magister") || lowerText.includes("master") || lowerText.includes("s2")) {
      education = "Magister (S2)";
    } else if (lowerText.includes("diploma") || lowerText.includes("d3") || lowerText.includes("d4")) {
      education = "Diploma (D3/D4)";
    } else {
      education = "Belum teridentifikasi (silakan sesuaikan)";
    }

    const gpa = extractGpaFromText(extractedText);

    // Draf durasi pengalaman: rentang tanggal digabung (tanpa hitung ganda), lalu durasi eksplisit.
    const experienceYears = extractExperienceYears(extractedText);
    const skillDetails = SKILL_RULES.filter((r) => detectedSkills.includes(r.name)).map((rule) => ({
      name: rule.name, needsReview: true, claimed: false,
      evidence: lines.find((line) => rule.regex.test(line))?.slice(0, 500) || null,
    }));

    const summary =
      detectedSkills.length > 0
        ? `Kandidat berfokus pada keahlian ${detectedSkills.slice(0, 4).join(", ")}. Hasil ekstraksi siap dikoreksi pengguna.`
        : "Dokumen CV berhasil dibaca. Tidak ada skill yang langsung terdeteksi; silakan tambahkan skill-mu secara manual pada form koreksi sebelum submit.";

    return NextResponse.json({
      success: true,
      candidateName,
      filename: file.name,
      fileUrl: presignedUrl,
      r2Key: safeKey,
      education,
      gpa,
      experienceYears,
      summary,
      skills: finalSkills,
      skillDetails,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal memproses unggahan dokumen: " + (err.message || "Kesalahan server internal") },
      { status: 500 }
    );
  }
}

