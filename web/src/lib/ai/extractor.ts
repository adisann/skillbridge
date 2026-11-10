import { parseDocumentWithLlamaParse } from "./llamaparse";

interface ExtractedJobData {
  title: string;
  company: string;
  location: string;
  canonicalTitle: "Data Analyst" | "BI Analyst";
  seniority: "Junior" | "Mid" | "Senior" | "Lead";
  employmentType: string;
  experienceYearsMin: number;
  education: string;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
  sourceUrl?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `Anda adalah AI parser lowongan pekerjaan profesional untuk SkillBridge.
Tugas Anda adalah membaca teks atau gambar poster/flyer lowongan pekerjaan, lalu mengekstrak informasinya secara akurat dan objektif ke dalam format JSON terstruktur.

Aturan Ekstraksi:
1. title: Judul posisi pekerjaan sesuai yang tertulis di dokumen/poster (cth. "Network Security Engineer", "Junior Data Analyst", "Cyber Security Engineer").
2. company: Nama perusahaan penyelenggara rekrutmen. Jika tidak tertulis, kosongkan ("").
3. location: Lokasi kerja (cth. "Jakarta, Indonesia (Hybrid)" atau "Indonesia").
4. canonicalTitle: Pilih "BI Analyst" jika posisi berfokus pada Business Intelligence/Reporting/Power BI. Pilih "Data Analyst" untuk posisi analitik data, engineering, teknis lainnya.
5. seniority: Pilih salah satu dari "Junior", "Mid", "Senior", atau "Lead". Jika tertera fresh graduate/intern/0-1 tahun, pilih "Junior".
6. employmentType: Umumnya "Full-time", "Contract", atau "Internship".
7. experienceYearsMin: Angka bulat tahun minimal pengalaman (misal: 0, 1, 2). Jika fresh graduates are welcome, isi 0.
8. education: Jenjang dan jurusan pendidikan yang dicari (misal: "Bachelor / S1 Statistika, Ilmu Komputer, atau bidang kuantitatif terkait").
9. requiredSkills: Array string berisi keterampilan teknis/analitis atau tools kerja yang WAJIB dikuasai dalam pelaksanaan tugas (misal: ["SQL", "Python", "Tableau"]).
   PENTING - BEDAKAN JURUSAN vs SKILL:
   - JANGAN PERNAH memasukkan nama jurusan / program studi (seperti "Statistics", "Computer Science", "Matematika", "Ekonomi", "Teknik Informatika") ke dalam requiredSkills atau preferredSkills jika kata tersebut HANYA muncul dalam konteks syarat latar belakang pendidikan/ijazah (misal: "Bachelor's degree in Statistics, Computer Science, or Mathematics", "Lulusan S1 Statistika/TI", "Terbuka untuk jurusan Statistika"). Masukkan itu ke dalam properti 'education', BUKAN 'requiredSkills'.
   - HANYA masukkan "Statistics" (atau skill metode statistik) ke dalam requiredSkills/preferredSkills jika lowongan secara eksplisit menuntut penguasaan teknis praktis statistika dalam tugas harian (misal: "A solid grasp of experiment design and statistics", "Pemahaman statistika inferensial, hypothesis testing, A/B testing, regression modeling").
10. preferredSkills: Array string berisi skill nilai tambah/sertifikasi praktis yang bukan sekadar jurusan kuliah (misal: ["A/B Testing", "Tableau", "Git"]).
11. description: Ringkasan atau isi lengkap deskripsi pekerjaan dan tanggung jawab yang ditemukan pada teks/poster. Sertakan juga email lamaran jika ada di poster.
12. sourceUrl: HANYA isi jika benar-benar ada tautan website (dimulai https:// atau http://) yang tertulis eksplisit di dalam poster/dokumen. JIKA TIDAK ADA TAUTAN URL, WAJIB ISI null. JANGAN PERNAH MENGARANG ATAU BERHALUSINASI MEMBUAT TAUTAN WEBSITE SENDIRI.
13. Kembalikan HANYA format JSON valid tanpa tanda kutip markdown tambahan jika memungkinkan.`;

export async function extractJobFromText(rawText: string, sourceUrl?: string): Promise<ExtractedJobData> {
  const apiKey = process.env.AI_API_KEY;
  const primaryModel = process.env.AI_MODEL || "gemini-3.1-flash-lite";

  // Step 1: Coba gunakan Google Gemini (dengan fallback model)
  if (apiKey) {
    const candidateModels = [primaryModel, "gemini-3.8-flash", "gemini-2.5-flash"];
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const userPrompt = `Ekstrak lowongan pekerjaan berikut ke dalam format JSON:\n\n${rawText.slice(0, 15000)}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return sanitizeJobData(parsed, sourceUrl);
          }
        }
      } catch (geminiErr) {
        console.warn(`[Extractor] Gemini ${model} text extraction error:`, geminiErr);
      }
    }
  }

  // Step 2: Fallback ke Groq jika Gemini quota/busy
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content || "";
        content = content.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(content);
        return sanitizeJobData(parsed, sourceUrl);
      }
    } catch (groqErr) {
      console.error("[Extractor] Groq text fallback failed:", groqErr);
    }
  }

  throw new Error("Gagal mengekstrak lowongan kerja dengan AI. Silakan coba kembali beberapa saat lagi.");
}

export async function extractJobFromImage(
  base64Data: string,
  mimeType: string,
  filename: string = "job-flyer.jpg"
): Promise<ExtractedJobData> {
  const apiKey = process.env.AI_API_KEY;
  const prompt = `Lakukan OCR (Optical Character Recognition) pada gambar poster/flyer lowongan kerja ini secara menyeluruh, lalu ekstrak informasinya ke dalam format JSON terstruktur:
{
  "title": "...",
  "company": "...",
  "location": "...",
  "canonicalTitle": "Data Analyst" | "BI Analyst",
  "seniority": "Junior" | "Mid" | "Senior" | "Lead",
  "employmentType": "Full-time",
  "experienceYearsMin": 0,
  "education": "Bachelor",
  "requiredSkills": ["..."],
  "preferredSkills": ["..."],
  "description": "...",
  "sourceUrl": null
}
Catatan: JANGAN MENGARANG TAUTAN WEB! Isi "sourceUrl" dengan null jika tidak ada tautan URL website eksplisit pada flyer/poster.`;

  // Step 1: Coba Google Gemini Vision dengan Retry & Multi-Model
  if (apiKey) {
    const candidateModels = [
      process.env.AI_MODEL || "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
    ];

    for (const model of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt },
                  ],
                },
              ],
              systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              const parsed = JSON.parse(candidateText);
              return sanitizeJobData(parsed);
            }
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
          console.warn(`[Extractor] Error calling Gemini ${model}:`, err);
          break;
        }
      }
    }
  }

  // Step 2: Fallback ke Groq Vision (qwen/qwen3.8-27b) jika Gemini sedang lonjakan beban (503/429)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      console.info("[Extractor] Gemini busy/unavailable. Executing fallback to Groq Vision (qwen/qwen3.8-27b)...");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content || "";
        content = content.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(content);
        return sanitizeJobData(parsed);
      } else {
        const errText = await res.text().catch(() => "");
        console.error(`[Extractor] Groq Vision error HTTP ${res.status}:`, errText);
      }
    } catch (groqErr) {
      console.error("[Extractor] Groq Vision fallback failed:", groqErr);
    }
  }

  // Step 3: Fallback ke LlamaParse Cloud REST API (10.000 free credits/bulan)
  const llamaKey = process.env.LLAMA_CLOUD_API_KEY;
  if (llamaKey) {
    try {
      console.info("[Extractor] Executing fallback to LlamaParse (cost_effective v2 engine)...");
      const buffer = Buffer.from(base64Data, "base64");
      const parsedMarkdown = await parseDocumentWithLlamaParse(buffer, mimeType, filename, {
        tier: "cost_effective",
        version: "latest",
      });

      if (parsedMarkdown && parsedMarkdown.length > 20) {
        console.info(`[Extractor] LlamaParse berhasil membaca dokumen (${parsedMarkdown.length} karakter). Menjalankan ekstraksi teks terstruktur...`);
        const extracted = await extractJobFromText(parsedMarkdown);
        return extracted;
      }
    } catch (llamaErr) {
      console.error("[Extractor] LlamaParse fallback error:", llamaErr);
    }
  }

  throw new Error(
    "Layanan AI OCR sedang mengalami lonjakan beban sementara. Silakan klik tombol 'Baca & Ekstrak OCR' kembali."
  );
}

function sanitizeJobData(raw: Record<string, unknown>, sourceUrl?: string): ExtractedJobData {
  const rawTitle = String(raw.title || "Data Analyst").trim();
  const rawCanonical = String(raw.canonicalTitle || "").toLowerCase();

  let canonicalTitle: "Data Analyst" | "BI Analyst" = "Data Analyst";
  if (rawCanonical.includes("bi") || rawTitle.toLowerCase().includes("business intelligence") || rawTitle.toLowerCase().includes("bi analyst")) {
    canonicalTitle = "BI Analyst";
  }

  const rawSeniority = String(raw.seniority || "").toLowerCase();
  let seniority: "Junior" | "Mid" | "Senior" | "Lead" = "Junior";
  if (rawSeniority.includes("lead") || rawSeniority.includes("head") || rawSeniority.includes("principal")) {
    seniority = "Lead";
  } else if (rawSeniority.includes("senior") || rawSeniority.includes("sr")) {
    seniority = "Senior";
  } else if (rawSeniority.includes("mid") || rawSeniority.includes("middle")) {
    seniority = "Mid";
  }

  const description = String(raw.description || "Deskripsi lowongan diekstrak melalui AI OCR.").trim();

  const requiredSkills = Array.isArray(raw.requiredSkills)
    ? filterOutEducationOnlySkills(raw.requiredSkills.map((s) => String(s).trim()).filter(Boolean), description)
    : ["SQL", "Microsoft Excel"];

  const preferredSkills = Array.isArray(raw.preferredSkills)
    ? filterOutEducationOnlySkills(raw.preferredSkills.map((s) => String(s).trim()).filter(Boolean), description)
    : [];

  return {
    title: rawTitle,
    company: String(raw.company || "").trim(),
    location: String(raw.location || "Indonesia (Hybrid)").trim(),
    canonicalTitle,
    seniority,
    employmentType: String(raw.employmentType || "Full-time").trim(),
    experienceYearsMin: typeof raw.experienceYearsMin === "number" ? raw.experienceYearsMin : (Number(raw.experienceYearsMin) || 0),
    education: String(raw.education || "Bachelor / S1").trim(),
    requiredSkills,
    preferredSkills,
    description,
    sourceUrl: sourceUrl
      ? sourceUrl.trim()
      : raw.sourceUrl &&
        String(raw.sourceUrl).startsWith("http") &&
        !String(raw.sourceUrl).includes("skillbridge.id") &&
        !String(raw.sourceUrl).includes("example.com")
      ? String(raw.sourceUrl).trim()
      : undefined,
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
