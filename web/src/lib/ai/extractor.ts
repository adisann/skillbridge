import { parseDocumentWithLlamaParse } from "./llamaparse.ts";

interface ExtractedJobData {
  title: string;
  company: string;
  location: string;
  canonicalTitle: string;
  seniority: string;
  employmentType: string;
  experienceYearsMin: number | null;
  education: string;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
  sourceUrl?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `Anda adalah AI parser lowongan pekerjaan profesional untuk SkillBridge.
Tugas Anda adalah membaca teks atau gambar poster/flyer lowongan pekerjaan, lalu mengekstrak informasinya secara akurat dan objektif ke dalam format JSON terstruktur.

Aturan Ekstraksi:
Gunakan hanya informasi dari sumber. Untuk teks yang tidak tercantum, isi ""; untuk daftar yang tidak tercantum, isi []; untuk pengalaman yang tidak tercantum, isi null. Jika judul atau deskripsi tidak dapat dibaca, biarkan kolom tersebut kosong.
1. title: Judul posisi pekerjaan sesuai yang tertulis di dokumen/poster (cth. "Network Security Engineer", "Junior Data Analyst", "Cyber Security Engineer").
2. company: Nama perusahaan penyelenggara rekrutmen. Jika tidak tertulis, kosongkan ("").
3. location: Lokasi kerja (cth. "Jakarta, Indonesia (Hybrid)" atau "Indonesia").
4. canonicalTitle: Nama role yang sesuai dengan pekerjaan yang tertulis. Jangan memberi label Data Analyst atau BI Analyst pada pekerjaan di bidang lain.
5. seniority: Pilih salah satu dari "Junior", "Mid", "Senior", atau "Lead". Jika tertera fresh graduate/intern/0-1 tahun, pilih "Junior".
6. employmentType: Jenis pekerjaan hanya jika tertulis.
7. experienceYearsMin: Angka bulat tahun minimal pengalaman (misal: 0, 1, 2). Jika fresh graduates are welcome, isi 0.
8. education: Jenjang dan jurusan pendidikan yang dicari (misal: "Bachelor / S1 Statistika, Ilmu Komputer, atau bidang kuantitatif terkait").
9. requiredSkills: Array string berisi keterampilan teknis/analitis, tools kerja, serta kemampuan bahasa/sertifikasi yang WAJIB (misal: ["SQL", "Python", "Mandarin (HSK 5)"]). Pertahankan level sertifikasi yang tertulis: "Minimum HSK Level 5" menjadi "Mandarin (HSK 5)"; jangan hilangkan syarat bahasa. Jika level tidak disebutkan, tulis "Mandarin" tanpa mengarang level. Bahasa/sertifikasi yang hanya preferred masuk preferredSkills.
   Bahasa Jepang/JLPT juga wajib dipertahankan: "minimum JLPT N1" menjadi "Jepang (JLPT N1)". Jangan menyamakan level N1 dengan N5 atau menghilangkan proficiency bahasa. Skill Indonesia/Inggris yang bermakna sama ditulis satu nama kanonis (Statistika -> Statistics; Analisis Data/Data Analisis -> Data Analysis).
   PENTING - BEDAKAN JURUSAN vs SKILL:
   - JANGAN PERNAH memasukkan nama jurusan / program studi (seperti "Statistics", "Computer Science", "Matematika", "Ekonomi", "Teknik Informatika") ke dalam requiredSkills atau preferredSkills jika kata tersebut HANYA muncul dalam konteks syarat latar belakang pendidikan/ijazah (misal: "Bachelor's degree in Statistics, Computer Science, or Mathematics", "Lulusan S1 Statistika/TI", "Terbuka untuk jurusan Statistika"). Masukkan itu ke dalam properti 'education', BUKAN 'requiredSkills'.
   - HANYA masukkan "Statistics" (atau skill metode statistik) ke dalam requiredSkills/preferredSkills jika lowongan secara eksplisit menuntut penguasaan teknis praktis statistika dalam tugas harian (misal: "A solid grasp of experiment design and statistics", "Pemahaman statistika inferensial, hypothesis testing, A/B testing, regression modeling").
10. preferredSkills: Array string berisi skill nilai tambah/sertifikasi praktis yang bukan sekadar jurusan kuliah (misal: ["A/B Testing", "Tableau", "Git"]). Normalisasikan "Big Query" / "Google Big Query" menjadi "BigQuery". "Plus Point If You Have" menandai nilai tambah. Daftar contoh alat dalam "Eg/e.g./contoh ... etc" tidak berarti semuanya wajib; pertahankan kalimat aslinya dalam description agar kelompok contoh dan alternatif bisa dianalisis. Bila suatu alat hanya muncul sebagai contoh pada syarat utama dan juga disebut eksplisit dalam bagian nilai plus, masukkan alat itu ke preferredSkills.
11. description: Ringkasan atau isi lengkap deskripsi pekerjaan dan tanggung jawab yang ditemukan pada teks/poster. Sertakan juga email lamaran jika ada di poster.
12. sourceUrl: HANYA isi jika benar-benar ada tautan website (dimulai https:// atau http://) yang tertulis eksplisit di dalam poster/dokumen. JIKA TIDAK ADA TAUTAN URL, WAJIB ISI null. JANGAN PERNAH MENGARANG ATAU BERHALUSINASI MEMBUAT TAUTAN WEBSITE SENDIRI.
13. Kembalikan HANYA format JSON valid tanpa tanda kutip markdown tambahan jika memungkinkan.`;

interface ExtractionOptions {
  requireDescription?: boolean;
  signal?: AbortSignal;
}

function requestSignal(signal: AbortSignal) {
  return AbortSignal.any([signal, AbortSignal.timeout(7000)]);
}

function geminiText(parts: { text?: string; thought?: boolean }[] | undefined): string {
  return parts?.filter((part) => !part.thought).map((part) => part.text ?? "").join("") ?? "";
}

type GeminiInput = { text: string } | { inlineData: { mimeType: string; data: string } };

function geminiModels(): string[] {
  return [...new Set([process.env.AI_MODEL || "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"])];
}

function requestGemini(model: string, apiKey: string, parts: GeminiInput[], signal: AbortSignal) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal,
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
}

export async function extractJobFromText(
  rawText: string,
  sourceUrl?: string,
  { requireDescription = true, signal = AbortSignal.timeout(12000) }: ExtractionOptions = {},
): Promise<ExtractedJobData> {
  const apiKey = process.env.AI_API_KEY;

  // Step 1: Coba gunakan Google Gemini (dengan fallback model)
  if (apiKey) {
    const geminiSignal = AbortSignal.any([signal, AbortSignal.timeout(6500)]);
    for (const model of geminiModels()) {
      if (geminiSignal.aborted) break;
      try {
        const userPrompt = `Ekstrak lowongan pekerjaan berikut ke dalam format JSON:\n\n${rawText.slice(0, 15000)}`;
        const res = await requestGemini(model, apiKey, [{ text: userPrompt }], geminiSignal);

        if (res.ok) {
          const data = await res.json();
          return parseJobData(geminiText(data?.candidates?.[0]?.content?.parts), requireDescription, sourceUrl);
        }
        console.warn("[Extractor] Gemini text response", model, res.status);
      } catch (error) {
        console.warn("[Extractor] Gemini text extraction failed", model, (error as Error).name);
      }
    }
  }

  // Step 2: Fallback ke Groq jika Gemini quota/busy
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !signal.aborted) {
    try {
      const groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: requestSignal(signal),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            { role: "user", content: `Kembalikan HANYA JSON objek valid dari lowongan ini:\n\n${rawText.slice(0, 10000)}` },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return parseJobData(data?.choices?.[0]?.message?.content, requireDescription, sourceUrl);
      }
      console.warn("[Extractor] Groq text response", res.status);
    } catch (error) {
      console.warn("[Extractor] Groq text extraction failed", (error as Error).name);
    }
  }

  throw new Error("Gagal mengekstrak lowongan kerja dengan AI. Silakan coba kembali beberapa saat lagi.");
}

export async function extractJobFromImage(
  base64Data: string,
  mimeType: string,
  filename = "job-flyer.jpg",
  { requireDescription = true, signal = AbortSignal.timeout(25000) }: ExtractionOptions = {},
): Promise<ExtractedJobData> {
  const apiKey = process.env.AI_API_KEY;
  const prompt = `Lakukan OCR (Optical Character Recognition) pada gambar poster/flyer lowongan kerja ini secara menyeluruh, lalu ekstrak informasinya ke dalam format JSON terstruktur:
{
  "title": "...",
  "company": "...",
  "location": "...",
  "canonicalTitle": "",
  "seniority": "",
  "employmentType": "",
  "experienceYearsMin": null,
  "education": "",
  "requiredSkills": ["..."],
  "preferredSkills": ["..."],
  "description": "...",
  "sourceUrl": null
}
Catatan: JANGAN MENGARANG TAUTAN WEB! Isi "sourceUrl" dengan null jika tidak ada tautan URL website eksplisit pada flyer/poster.`;

  // Step 1: Coba Google Gemini Vision dengan Retry & Multi-Model
  if (apiKey) {
    const geminiSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
    for (const model of geminiModels()) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts && !geminiSignal.aborted) {
        attempts++;
        try {
          const res = await requestGemini(model, apiKey, [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ], requestSignal(geminiSignal));

          if (res.ok) {
            const data = await res.json();
            return parseJobData(geminiText(data?.candidates?.[0]?.content?.parts), requireDescription);
          }

          // Jika 503 (high demand) atau 429 (rate limit), tunggu 1.2 detik lalu coba ulang
          if (res.status === 503 || res.status === 429) {
            console.warn(`[Extractor] Gemini ${model} returned HTTP ${res.status}. Attempt ${attempts}/${maxAttempts}. Retrying...`);
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }

          // Jika 404 atau bad request, lanjut ke model berikutnya
          break;
        } catch (err) {
          console.warn("[Extractor] Gemini OCR failed", model, (err as Error).name);
          break;
        }
      }
    }
  }

  // Step 2: Fallback ke Groq Vision (qwen/qwen3.8-27b) jika Gemini sedang lonjakan beban (503/429)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && mimeType.startsWith("image/") && !signal.aborted) {
    try {
      console.info("[Extractor] Gemini busy/unavailable. Executing fallback to Groq Vision (qwen/qwen3.8-27b)...");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: requestSignal(signal),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: `${EXTRACTION_SYSTEM_PROMPT}\n\n${prompt}` },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
              ],
            },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return parseJobData(data?.choices?.[0]?.message?.content, requireDescription);
      } else {
        console.warn("[Extractor] Groq OCR response", res.status);
      }
    } catch (groqErr) {
      console.warn("[Extractor] Groq OCR failed", (groqErr as Error).name);
    }
  }

  // Step 3: Fallback ke LlamaParse Cloud REST API (10.000 free credits/bulan)
  const llamaKey = process.env.LLAMA_CLOUD_API_KEY;
  if (llamaKey && !signal.aborted) {
    try {
      console.info("[Extractor] Executing fallback to LlamaParse (cost_effective v2 engine)...");
      const buffer = Buffer.from(base64Data, "base64");
      const parsedMarkdown = await parseDocumentWithLlamaParse(buffer, mimeType, filename, {
        tier: "cost_effective",
        version: "latest",
        signal,
      });

      if (parsedMarkdown && parsedMarkdown.length > 20) {
        console.info(`[Extractor] LlamaParse berhasil membaca dokumen (${parsedMarkdown.length} karakter). Menjalankan ekstraksi teks terstruktur...`);
        const extracted = await extractJobFromText(parsedMarkdown, undefined, { requireDescription, signal });
        return extracted;
      }
    } catch (llamaErr) {
      console.warn("[Extractor] LlamaParse OCR failed", (llamaErr as Error).name);
    }
  }

  throw new Error(
    "Data lowongan belum berhasil dibaca dari poster. Coba lagi dengan berkas yang lebih jelas atau gunakan Tambah Manual."
  );
}

function readText(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  return /^(?:\.{2,}|…|[-–—]+|n\/?a|unknown|tidak diketahui|null)$/i.test(text) ? "" : text;
}

function parseJobData(content: unknown, requireDescription: boolean, sourceUrl?: string): ExtractedJobData {
  const raw: unknown = JSON.parse(readText(content).replace(/^```(?:json)?\s*|\s*```$/gi, ""));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Respons AI tidak berisi objek lowongan.");
  }

  const fields = raw as Record<string, unknown>;
  const title = readText(fields.title);
  const description = readText(fields.description);
  if (!title || (requireDescription && (
    !description || description.toLowerCase() === title.toLowerCase() ||
    /^deskripsi lowongan diekstrak melalui ai ocr\.?$/i.test(description)
  ))) {
    throw new Error("Judul atau deskripsi lowongan tidak terbaca.");
  }

  const readSkills = (value: unknown) =>
    Array.isArray(value) ? filterOutEducationOnlySkills(value.map(readText).filter(Boolean), description) : [];
  const years = fields.experienceYearsMin;
  const experience = typeof years === "number" || (typeof years === "string" && /^\d+$/.test(years.trim()))
    ? Number(years)
    : NaN;
  const extractedUrl = readText(fields.sourceUrl);

  return {
    title,
    company: readText(fields.company),
    location: readText(fields.location),
    canonicalTitle: readText(fields.canonicalTitle),
    seniority: readText(fields.seniority),
    employmentType: readText(fields.employmentType),
    experienceYearsMin: Number.isSafeInteger(experience) && experience >= 0 ? experience : null,
    education: readText(fields.education),
    requiredSkills: readSkills(fields.requiredSkills),
    preferredSkills: readSkills(fields.preferredSkills),
    description,
    sourceUrl: sourceUrl?.trim() || (
      /^https?:\/\//i.test(extractedUrl) && !/skillbridge\.id|example\.com/i.test(extractedUrl) ? extractedUrl : undefined
    ),
  };
}

/**
 * Memastikan nama jurusan akademik (seperti 'Statistics', 'Computer Science')
 * tidak keliru diekstrak sebagai skill teknis jika teks aslinya hanya mensyaratkan ijazah/jurusan.
 */
function filterOutEducationOnlySkills(skills: string[], description: string): string[] {
  const lowerDesc = description.toLowerCase();

  return skills.filter((skill) => {
    const sLower = skill.toLowerCase();

    // Pengecekan khusus untuk 'Statistics' / 'Statistika'
    if (sLower === "statistics" || sLower === "statistika") {
      if (!lowerDesc.includes("statistic") && !lowerDesc.includes("statist")) return false;

      // Cek apakah konteksnya menuntut penguasaan/keahlian teknis nyata:
      const hasTechnicalSkillContext =
        /statistic(?:s|al)?\s+(?:analysis|modeling|methods?|techniques?|inference|tests?|knowledge|skills?|principles?|experiment)/i.test(lowerDesc) ||
        /(?:knowledge|grasp|understanding|proficien\w+|experience|competenc\w+|skills?)\s+(?:in|of|with)?\s*(?:[a-z\s,]+)?statistic/i.test(lowerDesc) ||
        /(?:experiment\s+design|hypothesis\s+testing|a\/b\s+testing)\s+(?:and|with|in)?\s*statistic/i.test(lowerDesc);

      const onlyDegreeContext =
        /(?:degree|sarjana|s1|s2|bachelor|master|jurusan|lulusan|discipline|major|background|field\s+of\s+study)\s+(?:in|of)?\s*[^.\n;]*\bstatistic/i.test(lowerDesc);

      // Jika hanya disebut dalam kualifikasi jurusan dan tidak ada konteks kebutuhan skill teknis, saring keluar
      if (onlyDegreeContext && !hasTechnicalSkillContext) {
        return false;
      }
    }

    // Hindari nama jurusan umum lain yang sering keliru dimasukkan sebagai skill teknis:
    if (["computer science", "ilmu komputer", "information technology", "teknik informatika", "information security", "sistem informasi", "information systems"].includes(sLower)) {
      const onlyDegree = /(?:degree|sarjana|s1|s2|bachelor|master|jurusan|lulusan|discipline|major|background|field\s+of\s+study)\s+(?:in|of)?\s*[^.\n;]*\b(?:computer\s+science|information\s+security|information\s+technology)/i.test(lowerDesc);
      const hasStrictSkillNeed = /(?:expert|proficien\w+|solid\s+skills?|hands-on)\s+in\s+[a-z\s,]+(?:computer\s+science|information\s+security)/i.test(lowerDesc);
      if (onlyDegree && !hasStrictSkillNeed) return false;
    }

    return true;
  });
}
