import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildSystemInstruction,
  formatChatMessagesForPrompt,
  isCvRelatedQuery,
  getInstantTemplateAnswer,
} from "../src/lib/ai/prompts.ts";
import { chatBurstRules, chatQuotaRules, cvUploadRules } from "../src/lib/rate-limit-policies.ts";
import type { ActiveJobContext, CandidateCVContext } from "../src/lib/ai/types.ts";

describe("SkillBridge AI Job Assistant Unit Tests", () => {
  const mockJob: ActiveJobContext = {
    id: "33333333-0000-0000-0000-000000000001",
    title: "Junior Data Analyst",
    canonicalTitle: "Data Analyst",
    company: "PT Nusantara FinTech",
    location: "Jakarta (Hybrid)",
    employmentType: "Full-time",
    seniority: "Junior",
    experienceYearsMin: 1,
    education: "Bachelor / S1",
    description: "Mencari Junior Data Analyst yang menguasai SQL dan visualisasi data.",
    contentHash: "hash_gh_40112",
    sourceName: "Greenhouse",
    sourceUrl: "https://boards.greenhouse.io/demo/jobs/1",
    retrievalMethod: "public_api",
    retrievedAt: "4 November 2026",
    requiredSkills: ["SQL", "Microsoft Excel", "Data Visualization"],
    preferredSkills: ["Python", "Tableau"],
  };

  test("1. buildSystemInstruction menginjeksi konteks lowongan aktif tanpa kontaminasi", () => {
    const prompt = buildSystemInstruction(mockJob, null);

    assert.ok(prompt.includes("PT Nusantara FinTech"), "Harus memuat nama perusahaan");
    assert.ok(prompt.includes("Junior Data Analyst"), "Harus memuat judul posisi");
    assert.ok(prompt.includes("SQL, Microsoft Excel, Data Visualization"), "Harus memuat required skills");
    assert.ok(prompt.includes("JANGAN PERNAH MENGARANG GAJI"), "Harus memuat guardrail anti-halusinasi gaji");
    assert.ok(prompt.includes("belum ditemukan di CV"), "Harus memuat aturan terminologi ramah");
    assert.ok(prompt.includes("Pengguna belum mengunggah atau mengaktifkan dokumen CV"), "Harus mencatat ketiadaan CV");
  });

  test("2. buildSystemInstruction memuat konteks CV pengguna saat data CV tersedia", () => {
    const mockCv: CandidateCVContext = {
      userId: "user-test-01",
      resumeId: "resume-test-01",
      fullName: "Budi Pratama",
      targetRole: "Data Analyst",
      experienceYears: 1,
      education: "Sarjana Sains Data",
      skills: ["SQL", "Python"],
      matchScore: 66,
      matchStatus: "underqualified",
      matchedSkills: ["SQL", "Python"],
      missingSkills: ["Microsoft Excel", "Data Visualization"],
    };

    const prompt = buildSystemInstruction(mockJob, mockCv);

    assert.ok(prompt.includes("Budi Pratama"), "Harus memuat nama kandidat");
    assert.ok(prompt.includes("Estimasi Skor Kecocokan Sistem: 66%"), "Harus memuat skor match");
    assert.ok(prompt.includes("Keterampilan Belum Ditemukan di CV: Microsoft Excel"), "Harus memuat gap skills");
  });

  test("3. isCvRelatedQuery membedakan pertanyaan CV vs pertanyaan lowongan umum", () => {
    assert.equal(isCvRelatedQuery("Apakah CV saya cocok dengan posisi ini?"), true);
    assert.equal(isCvRelatedQuery("Skill apa yang perlu saya tingkatkan?"), true);
    assert.equal(isCvRelatedQuery("Apakah kualifikasi saya memenuhi syarat?"), true);
    assert.equal(isCvRelatedQuery("Apa kekurangan gap saya?"), true);

    assert.equal(isCvRelatedQuery("Apa tanggung jawab pekerjaan ini?"), false);
    assert.equal(isCvRelatedQuery("Di mana lokasi kantor dan sistem kerjanya?"), false);
    assert.equal(isCvRelatedQuery("Apakah lowongan ini membutuhkan bahasa Inggris?"), false);
  });

  test("4. formatChatMessagesForPrompt membatasi riwayat percakapan agar hemat token", () => {
    const history = [
      { role: "user" as const, content: "Tanya 1" },
      { role: "assistant" as const, content: "Jawab 1" },
      { role: "user" as const, content: "Tanya 2" },
      { role: "assistant" as const, content: "Jawab 2" },
      { role: "user" as const, content: "Tanya 3" },
      { role: "assistant" as const, content: "Jawab 3" },
      { role: "user" as const, content: "Tanya 4" },
      { role: "assistant" as const, content: "Jawab 4" },
    ];

    const formatted = formatChatMessagesForPrompt(history, "Pertanyaan Terkini");
    assert.ok(!formatted.includes("Tanya 1"), "Pesan lama di luar window 6 pesan harus dipangkas");
    assert.ok(formatted.includes("Pertanyaan Pengguna Terbaru:"), "Harus memuat label pertanyaan terbaru");
    assert.ok(formatted.includes("Pertanyaan Terkini"), "Harus memuat pesan terkini");
  });

  test("5. kebijakan rate limit membatasi tamu lebih ketat dan selalu ada batas global harian", () => {
    const guestDaily = chatQuotaRules("1.2.3.4", null).find((r) => r.scope === "chat:guest-day");
    const userDaily = chatQuotaRules("1.2.3.4", "user-1").find((r) => r.scope === "chat:user-day");
    assert.ok(guestDaily && userDaily);
    assert.ok(guestDaily.limit < userDaily.limit, "Tamu harus punya kuota lebih kecil dari pengguna login");

    for (const rules of [chatQuotaRules("1.2.3.4", "user-1"), cvUploadRules("1.2.3.4", "user-1")]) {
      assert.ok(rules.some((r) => r.key === "global" && r.windowSeconds === 86400), "Harus ada batas global harian");
      assert.ok(rules.some((r) => r.key === "1.2.3.4"), "Harus ada batas per IP");
    }
    assert.equal(chatBurstRules("1.2.3.4")[0].windowSeconds, 60);
  });

  test("6. getInstantTemplateAnswer melayani FAQ instan berpola Ultralytics dan menolak pertanyaan di luar konteks", () => {
    // 1. FAQ Pendaftaran
    const registerAnswer = getInstantTemplateAnswer("Gimana cara daftar?", mockJob);
    assert.ok(registerAnswer);
    // Pendaftaran publik sengaja ditutup: jawaban tidak boleh menjanjikan pendaftaran
    assert.ok(registerAnswer.includes("Pendaftaran akun baru sementara belum dibuka"))
    assert.ok(!registerAnswer.includes("/register"));

    // 2. FAQ Upload CV
    const cvAnswer = getInstantTemplateAnswer("cara upload cv", mockJob);
    assert.ok(cvAnswer);
    assert.ok(cvAnswer.includes("menu Upload CV"));
    assert.ok(cvAnswer.includes("[Upload CV](/cv)"));

    // 3. Pertanyaan di luar konteks karier
    const oocAnswer = getInstantTemplateAnswer("buatkan kode python kalkulator", mockJob);
    assert.ok(oocAnswer);
    assert.ok(oocAnswer.includes("Maaf, aku khusus bantu seputar SkillBridge dan pencarian kerja."));
    assert.ok(oocAnswer.includes("[Jelajahi Lowongan](/jobs)"));

    // 4. Pertanyaan spesifik lowongan tidak ditangkap template (diteruskan ke model AI)
    const specificAnswer = getInstantTemplateAnswer("Apakah posisi ini butuh sertifikasi SQL?", mockJob);
    assert.equal(specificAnswer, null, "Pertanyaan spesifik harus bernilai null agar diproses model AI");
  });
});
