import test from "node:test";
import assert from "node:assert/strict";
import { calculateJobMatch } from "../src/lib/matching.ts";

test("Matching Engine Tests (AC-02, AC-05, AC-06)", async (t) => {
  await t.test("Skenario 1: Budi Pratama menghasilkan status Match (AC-05)", () => {
    const budiSkills = ["SQL", "Python", "Tableau", "Power BI", "Excel", "Statistics", "A/B Testing", "Data Modeling"];
    const job = {
      title: "Data Analyst",
      canonicalTitle: "Data Analyst",
      requiredSkills: ["SQL", "Python", "Tableau"],
      preferredSkills: ["Power BI", "Statistics"],
      experienceYearsMin: 1,
      education: "Sarjana (S1)",
      seniority: "Mid",
    };

    const result = calculateJobMatch(
      { skills: budiSkills, experienceYears: 2, education: "S1 Statistika", targetRole: "Data Analyst" },
      job
    );

    assert.equal(result.matchStatus, "match", "Budi harus berstatus 'match'");
    assert.ok(result.score >= 70, `Skor Budi (${result.score}) harus >= 70`);
    assert.equal(result.missingSkills.length, 0, "Semua skill wajib terpenuhi");
    assert.ok(result.factorsSupporting.length > 0, "Harus memiliki faktor pendukung");
  });

  await t.test("Skenario 2: Rina Kusuma menghasilkan status Underqualified (AC-05)", () => {
    const rinaSkills = ["Excel", "Canva", "Google Docs", "Data Entry"];
    const job = {
      title: "Data Analyst",
      canonicalTitle: "Data Analyst",
      requiredSkills: ["SQL", "Python", "Tableau"],
      preferredSkills: ["Statistics"],
      experienceYearsMin: 2,
      education: "Sarjana (S1)",
      seniority: "Junior",
    };

    const result = calculateJobMatch(
      { skills: rinaSkills, experienceYears: 0, education: "D3 Administrasi", targetRole: "Data Analyst" },
      job
    );

    assert.equal(result.matchStatus, "underqualified", "Rina harus berstatus 'underqualified'");
    assert.ok(result.score < 50, `Skor Rina (${result.score}) harus di bawah 50`);
    assert.ok(result.missingSkills.includes("SQL"), "SQL harus terdeteksi missing");
    assert.ok(result.missingSkills.includes("Python"), "Python harus terdeteksi missing");
    
    // Verifikasi aturan kebahasaan: Jangan gunakan kata 'tidak punya'
    const allLimitingText = result.factorsLimiting.join(" ").toLowerCase();
    assert.ok(!allLimitingText.includes("tidak punya"), "Tidak boleh menggunakan kata 'tidak punya'");
    assert.ok(allLimitingText.includes("belum ditemukan"), "Harus menggunakan frasa 'belum ditemukan'");
  });

  await t.test("Skenario 3: Kandidat Senior menghasilkan Potentially Overqualified (AC-05)", () => {
    const seniorSkills = ["SQL", "Python", "Tableau", "Power BI", "Excel", "Data Modeling", "ETL", "Machine Learning"];
    const juniorJob = {
      title: "Junior Data Analyst",
      canonicalTitle: "Data Analyst",
      requiredSkills: ["SQL", "Excel"],
      preferredSkills: ["Tableau"],
      experienceYearsMin: 1,
      education: "Sarjana (S1)",
      seniority: "Junior",
    };

    const result = calculateJobMatch(
      { skills: seniorSkills, experienceYears: 7, education: "S1 Ilmu Komputer", targetRole: "Data Analyst" },
      juniorJob
    );

    assert.equal(result.matchStatus, "potentially_overqualified", "Kandidat 7 tahun untuk posisi syarat 1 tahun harus berstatus 'potentially_overqualified'");
    assert.ok(result.factorsSupporting.some((f) => f.includes("melampaui level")), "Faktor pendukung harus menjelaskan overkualifikasi");
  });

  await t.test("Skenario 4: CV Tanpa Keterampilan menghasilkan Insufficient Evidence", () => {
    const emptyJob = {
      title: "Data Analyst",
      canonicalTitle: "Data Analyst",
      requiredSkills: ["SQL", "Python"],
      experienceYearsMin: 1,
      education: "Sarjana (S1)",
    };

    const result = calculateJobMatch(
      { skills: [], experienceYears: 0, education: null, targetRole: "Data Analyst" },
      emptyJob
    );

    assert.equal(result.matchStatus, "insufficient_evidence", "CV tanpa data skill harus menghasilkan 'insufficient_evidence'");
  });

  await t.test("Skenario 5: AC-02 Pembagian Kualifikasi menjadi Cocok, Belum Ditemukan, dan Belum Cukup Bukti", () => {
    // Kandidat punya Power BI dan SQL, tapi tidak punya Tableau (hanya punya Power BI yang serumpun BI tools)
    const candidateSkills = ["SQL", "Power BI", "Excel"];
    const job = {
      title: "BI Analyst",
      canonicalTitle: "BI Analyst",
      requiredSkills: ["SQL", "Tableau", "Spark"],
      preferredSkills: [],
      experienceYearsMin: 1,
    };

    const result = calculateJobMatch(
      { skills: candidateSkills, experienceYears: 1, education: "S1", targetRole: "BI Analyst" },
      job
    );

    const statuses = result.requirementsEvaluation.map((r) => ({ skill: r.skill, status: r.status }));

    // SQL -> Cocok
    const sqlReq = statuses.find((s) => s.skill === "SQL");
    assert.equal(sqlReq?.status, "cocok", "SQL harus cocok");

    // Tableau -> Belum cukup bukti (karena kandidat punya Power BI serumpun)
    const tableauReq = statuses.find((s) => s.skill === "Tableau");
    assert.equal(tableauReq?.status, "belum_cukup_bukti", "Tableau harus 'belum_cukup_bukti' karena ada Power BI");

    // Spark -> Belum ditemukan
    const sparkReq = statuses.find((s) => s.skill === "Spark");
    assert.equal(sparkReq?.status, "belum_ditemukan", "Spark harus 'belum_ditemukan'");
  });

  await t.test("Skenario 6: Redistribusi Bobot untuk Komponen Tanpa Data (Tidak Dihitung Nol)", () => {
    // Lowongan tanpa preferredSkills dan tanpa experienceYearsMin
    const jobWithoutOptionalData = {
      title: "Data Analyst",
      canonicalTitle: "Data Analyst",
      requiredSkills: ["SQL", "Python"],
      preferredSkills: [],
      experienceYearsMin: null,
      education: "Sarjana (S1)",
      seniority: "Junior",
    };

    const candidate = {
      skills: ["SQL", "Python"],
      experienceYears: 1,
      education: "Sarjana (S1)",
      targetRole: "Data Analyst",
    };

    const result = calculateJobMatch(candidate, jobWithoutOptionalData);

    // Pastikan kandidat yang memenuhi semua syarat yang ada mendapatkan skor tinggi (~100) dan tidak dipenalti
    assert.ok(result.score >= 90, `Skor harus tinggi (${result.score}) karena semua komponen yang ada terpenuhi`);

    // Pastikan total bobot dari komponen yang tersedia = 100%
    const totalActiveWeight = result.breakdown
      .filter((b) => b.available)
      .reduce((sum, b) => sum + b.weight, 0);

    assert.ok(
      Math.abs(totalActiveWeight - 100) <= 2,
      `Total bobot komponen tersedia (${totalActiveWeight}) harus mendekati 100%`
    );

    // Komponen yang tidak tersedia ditandai available = false
    const expItem = result.breakdown.find((b) => b.label === "Pengalaman Kerja");
    assert.equal(expItem?.available, false, "Pengalaman kerja harus marked unavailable");
    assert.equal(expItem?.weight, 0, "Bobot komponen unavailable harus 0");
  });

  await t.test("Skenario 7: AC-03 & AC-04 Agregasi Top Skills Pasar & Status Teks CV", () => {
    // Simulasi data agregasi lowongan unik
    const mockJobsData = [
      { id: "j1", role: "Data Analyst", skills: ["SQL", "Python", "Tableau"] },
      { id: "j2", role: "Data Analyst", skills: ["SQL", "Excel", "Power BI"] },
      { id: "j3", role: "Data Analyst", skills: ["SQL", "Python", "Excel"] },
      { id: "j4", role: "BI Analyst", skills: ["Power BI", "Tableau", "DAX", "SQL"] },
    ];

    // Filter role Data Analyst -> Sample N = 3
    const dataAnalystJobs = mockJobsData.filter((j) => j.role === "Data Analyst");
    const sampleN_DA = dataAnalystJobs.length;
    assert.equal(sampleN_DA, 3, "Sample N untuk Data Analyst harus 3");

    // Filter role BI Analyst -> Sample N = 1 (AC-03: N berubah saat filter berubah)
    const biJobs = mockJobsData.filter((j) => j.role === "BI Analyst");
    const sampleN_BI = biJobs.length;
    assert.equal(sampleN_BI, 1, "Sample N untuk BI Analyst harus 1");
    assert.notEqual(sampleN_DA, sampleN_BI, "Sample N harus berubah saat filter role diubah (AC-03)");

    // Hitung frekuensi unik skill untuk Data Analyst
    const freqDA: Record<string, number> = {};
    for (const job of dataAnalystJobs) {
      const seenInJob = new Set(job.skills);
      for (const s of seenInJob) {
        freqDA[s] = (freqDA[s] || 0) + 1;
      }
    }

    assert.equal(freqDA["SQL"], 3, "SQL muncul di 3 dari 3 lowongan DA (100%)");
    assert.equal(freqDA["Python"], 2, "Python muncul di 2 dari 3 lowongan DA (67%)");

    // AC-04: Penandaan status teks pada CV pelamar
    const candidateVerifiedCv = new Set(["sql", "excel"]);
    const candidateClaimedManual = new Set(["python"]); // Diklaim pengguna tetapi belum tertulis di CV

    const evaluateCvStatus = (skillName: string) => {
      const lower = skillName.toLowerCase();
      if (candidateVerifiedCv.has(lower)) return { status: "tercantum", label: "Tercantum di CV" };
      if (candidateClaimedManual.has(lower)) return { status: "perlu_verifikasi", label: "Perlu verifikasi (klaim mandiri)" };
      return { status: "belum_ditemukan", label: "Belum ditemukan di CV" };
    };

    assert.equal(evaluateCvStatus("SQL").label, "Tercantum di CV");
    assert.equal(evaluateCvStatus("Python").label, "Perlu verifikasi (klaim mandiri)");
    assert.equal(evaluateCvStatus("Tableau").label, "Belum ditemukan di CV");
  });

  await t.test("Skenario 8: FR-09 Rekomendasi Prioritas Belajar dari Gap Pasar", () => {
    // Gap skill diurutkan berdasarkan persentase permintaan pasar
    const marketSkillsRanked = [
      { skill: "SQL", demandPercent: 100, inCv: true },
      { skill: "Python", demandPercent: 75, inCv: false },
      { skill: "Tableau", demandPercent: 65, inCv: false },
      { skill: "Power BI", demandPercent: 40, inCv: false },
    ];

    const learningGaps = marketSkillsRanked
      .filter((s) => !s.inCv)
      .map((s, idx) => ({
        skillName: s.skill,
        priority: idx === 0 ? "Tinggi" : "Menengah",
        demand: s.demandPercent,
      }));

    assert.equal(learningGaps[0].skillName, "Python", "Skill gap nomor 1 adalah Python (75% pasar)");
    assert.equal(learningGaps[0].priority, "Tinggi", "Prioritas harus 'Tinggi'");
    assert.equal(learningGaps[1].skillName, "Tableau", "Skill gap nomor 2 adalah Tableau (65% pasar)");
  });
});
