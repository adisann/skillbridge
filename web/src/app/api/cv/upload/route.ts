import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { uploadToR2, resumeKeyPrefix } from "@/lib/r2";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { cvUploadRules } from "@/lib/rate-limit-policies";
import { extractGpaFromText } from "@/lib/gpa";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
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

    // 2. Validasi Jenis Berkas (MIME & Ekstensi)
    const fileName = file.name.toLowerCase();
    const hasValidExt = fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".doc");
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !hasValidExt) {
      return NextResponse.json(
        { error: "Format berkas tidak diizinkan. Unggah dokumen berformat .PDF atau .DOCX." },
        { status: 400 }
      );
    }

    // 3. Validasi isi berkas (signature), bukan hanya nama/MIME yang bisa dipalsukan
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPdfFile = fileName.endsWith(".pdf") || file.type === "application/pdf";
    const isDocxFile =
      fileName.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (isPdfFile && buffer.toString("latin1", 0, 5) !== PDF_SIGNATURE) {
      return NextResponse.json({ error: "Isi berkas bukan PDF yang valid." }, { status: 400 });
    }
    if (isDocxFile && buffer.toString("latin1", 0, 2) !== ZIP_SIGNATURE) {
      return NextResponse.json({ error: "Isi berkas bukan DOCX yang valid." }, { status: 400 });
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
        extractedText = buffer.toString("utf-8", 0, Math.min(buffer.length, 65536));
      }
    } else if (isDocxFile) {
      try {
        const mammoth = await import("mammoth");
        const mammothResult = await mammoth.extractRawText({ buffer });
        extractedText = mammothResult.value || "";
      } catch (docErr) {
        console.warn("[Upload] Gagal mengekstrak DOCX via mammoth:", docErr);
        extractedText = buffer.toString("utf-8", 0, Math.min(buffer.length, 65536));
      }
    } else {
      extractedText = buffer.toString("utf-8", 0, Math.min(buffer.length, 65536));
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
    const { presignedUrl } = await uploadToR2(buffer, safeKey, file.type || "application/pdf");

    const lowerText = extractedText.toLowerCase();

    // Taksonomi aturan regex dengan boundary kata (mencegah salah deteksi huruf tunggal seperti 'r')
    const SKILL_RULES = [
      { name: "Python", regex: /\b(python|python3|py)\b/i },
      { name: "SQL", regex: /\b(sql|mysql|postgresql|postgres|pl\/sql|sqlite)\b/i },
      { name: "JavaScript", regex: /\b(javascript|js|ecmascript|node\.?js)\b/i },
      { name: "PHP", regex: /\b(php|mvc\s*php)\b/i },
      { name: "Laravel", regex: /\b(laravel)\b/i },
      { name: "Django", regex: /\b(django)\b/i },
      { name: "Microsoft Excel", regex: /\b(microsoft\s*excel|ms\s*excel|excel|pivot\s*tables?)\b/i },
      { name: "Microsoft Office", regex: /\b(microsoft\s*office|ms\s*office|office\s*365)\b/i },
      { name: "Tableau", regex: /\b(tableau)\b/i },
      { name: "Looker", regex: /\b(looker|looker\s*studio|google\s*data\s*studio)\b/i },
      { name: "Power BI", regex: /\b(power\s*bi|powerbi|dax)\b/i },
      { name: "Data Visualization", regex: /\b(data\s*visualization|visualisasi\s*data)\b/i },
      { name: "Web Scraping", regex: /\b(web\s*scraping|scraping|selenium|beautifulsoup|bs4)\b/i },
      { name: "Pandas", regex: /\b(pandas)\b/i },
      { name: "Machine Learning", regex: /\b(machine\s*learning|scikit-learn|lightgbm|xgboost|tensorflow|pytorch)\b/i },
      { name: "Deep Learning", regex: /\b(deep\s*learning)\b/i },
      { name: "Data Science", regex: /\b(data\s*science|sains\s*data|data\s*scientist)\b/i },
      { name: "Business Analytics", regex: /\b(business\s*analytics|analitika\s*bisnis|business\s*analysis)\b/i },
      { name: "Data Cleaning", regex: /\b(data\s*cleaning|pembersihan\s*data|data\s*preprocessing)\b/i },
      { name: "Data Modeling", regex: /\b(data\s*modeling|predictive\s*modeling|pemodelan\s*data)\b/i },
      { name: "Database Management", regex: /\b(database\s*management|database|basis\s*data|dbms)\b/i },
      { name: "Git", regex: /\b(git|github|gitlab)\b/i },
      { name: "Statistics", regex: /\b(statistics|statistika|statistical)\b/i },
      { name: "Project Management", regex: /\b(project\s*management|manajemen\s*proyek)\b/i },
      { name: "ETL", regex: /\b(etl|data\s*pipeline)\b/i },
      { name: "BigQuery", regex: /\b(bigquery|google\s*bigquery)\b/i },
      { name: "Snowflake", regex: /\b(snowflake)\b/i },
      { name: "dbt", regex: /\b(dbt|data\s*build\s*tool)\b/i },
      { name: "Metabase", regex: /\b(metabase)\b/i },
      { name: "A/B Testing", regex: /\b(a\/b\s*testing|ab\s*testing)\b/i },
      { name: "R", regex: /\b(bahasa\s*r|r\s*programming|r-project|rstudio)\b/i },
    ];

    const detectedSkills: string[] = [];
    for (const rule of SKILL_RULES) {
      if (rule.regex.test(extractedText)) {
        detectedSkills.push(rule.name);
      }
    }

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

    // Ekstraksi pengalaman
    let experienceYears = 0;
    const expMatch = lowerText.match(/(\d+)\+?\s*(?:tahun|thn|years?|yrs?)\b/);
    if (expMatch) {
      experienceYears = parseInt(expMatch[1], 10);
    } else if (lowerText.includes("fresh graduate") || lowerText.includes("lulusan baru")) {
      experienceYears = 0;
    } else if (lowerText.includes("pkl") || lowerText.includes("magang") || lowerText.includes("internship")) {
      experienceYears = 1;
    }

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
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal memproses unggahan dokumen: " + (err.message || "Kesalahan server internal") },
      { status: 500 }
    );
  }
}

