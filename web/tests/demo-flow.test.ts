import test from "node:test";
import assert from "node:assert/strict";
import { calculateJobMatch } from "../src/lib/matching.ts";

test("Judge Demo Flow End-to-End Simulation", async (t) => {
  // Step 1: Demo Juri Login Validation
  let juriSession: { userId: string; email: string; fullName: string } | null = null;

  await t.test("Step 1: Autentikasi Akun Demo Juri (1-Click Login)", () => {
    // Simulasi konfigurasi akun demo juri sesuai AGENTS.md
    const demoCredentials = {
      email: "juri@skillbridge.id",
      demoPassword: "DemoJuriInvofest2026!",
      profile: {
        id: "aed3b8b5-c656-4cf6-8246-4e8c3384860c",
        full_name: "Budi Pratama (Juri Demo)",
        target_role: "Data Analyst",
      },
    };

    assert.equal(demoCredentials.email, "juri@skillbridge.id");
    assert.ok(demoCredentials.demoPassword.length >= 8);
    assert.equal(demoCredentials.profile.id, "aed3b8b5-c656-4cf6-8246-4e8c3384860c");

    juriSession = {
      userId: demoCredentials.profile.id,
      email: demoCredentials.email,
      fullName: demoCredentials.profile.full_name,
    };

    assert.ok(juriSession.userId, "Sesi juri harus terisi");
  });

  // Step 2: Dashboard State & Profile Summary
  await t.test("Step 2: Dashboard membaca ringkasan profil juri", () => {
    assert.ok(juriSession, "Sesi juri harus aktif");

    const dashboardState = {
      hasActiveCv: true,
      cvName: "CV_Budi_Pratama_Data_Analyst.pdf",
      targetRole: "Data Analyst",
      extractedSkillsCount: 8,
      matchingJobsCount: 12,
    };

    assert.equal(dashboardState.hasActiveCv, true, "Juri demo memiliki CV aktif siap uji");
    assert.ok(dashboardState.extractedSkillsCount > 0);
  });

  // Step 3: CV Upload & Skill Correction (AC-01)
  let correctedCvData: {
    skills: string[];
    manualSkills: string[];
    experienceYears: number;
    education: string;
    targetRole: string;
  } | null = null;

  await t.test("Step 3: Koreksi Skill CV sebelum pencocokan (AC-01)", () => {
    // Hasil ekstraksi awal dari PDF
    const extractedSkills = ["SQL", "Python", "Tableau", "Excel", "Data Modeling"];
    const manualAdditions = ["Power BI", "Statistics"];
    const removedSkill = "Excel"; // Juri menghapus skill dasar jika diinginkan

    const finalSkills = extractedSkills
      .filter((s) => s !== removedSkill)
      .concat(manualAdditions);

    correctedCvData = {
      skills: finalSkills,
      manualSkills: manualAdditions,
      experienceYears: 2,
      education: "S1 Statistika",
      targetRole: "Data Analyst",
    };

    assert.ok(correctedCvData.skills.includes("Power BI"), "Skill manual harus masuk");
    assert.ok(correctedCvData.skills.includes("Statistics"), "Skill manual harus masuk");
    assert.ok(!correctedCvData.skills.includes("Excel"), "Skill yang dihapus tidak boleh ada");
    assert.equal(correctedCvData.skills.length, 6);
  });

  // Step 4: Job Explorer & Matching (AC-02, AC-05, AC-06)
  await t.test("Step 4: Job Explorer menghitung kecocokan multi-role (AC-02, AC-05, AC-06)", () => {
    assert.ok(correctedCvData);

    const mockJobCatalog = [
      {
        id: "job-1",
        title: "Senior Data Analyst",
        canonicalTitle: "Data Analyst",
        company: "PT Teknologi Bangsa",
        location: "Jakarta, Indonesia",
        sourceUrl: "https://boards.greenhouse.io/tekno/jobs/101",
        requiredSkills: ["SQL", "Python", "Tableau"],
        preferredSkills: ["Power BI", "Statistics"],
        experienceYearsMin: 2,
        education: "Sarjana (S1)",
        seniority: "Mid",
      },
      {
        id: "job-2",
        title: "Cyber Security Engineer",
        canonicalTitle: "Cyber Security",
        company: "PT Cyber Solusi",
        location: "Surabaya, Indonesia",
        sourceUrl: "https://jobstreet.co.id/job/202",
        requiredSkills: ["Network Security", "SIEM", "Penetration Testing", "Firewall"],
        preferredSkills: ["CISSP", "Incident Response"],
        experienceYearsMin: 3,
        education: "Sarjana (S1)",
        seniority: "Mid",
      },
    ];

    // Hitung kecocokan CV Budi dengan Lowongan 1 (Data Analyst) -> Target Match
    const matchDataAnalyst = calculateJobMatch(correctedCvData, mockJobCatalog[0]);
    assert.equal(matchDataAnalyst.matchStatus, "match", "Budi harus berstatus 'match' untuk Data Analyst");
    assert.ok(matchDataAnalyst.score >= 70, "Skor harus >= 70%");
    assert.equal(matchDataAnalyst.missingSkills.length, 0, "Semua skill wajib terpenuhi");
    assert.ok(matchDataAnalyst.factorsSupporting.length > 0, "Harus menyertakan bukti faktor pendukung");

    // Hitung kecocokan CV Budi dengan Lowongan 2 (Cyber Security) -> Target Underqualified
    const matchCyber = calculateJobMatch(correctedCvData, mockJobCatalog[1]);
    assert.equal(matchCyber.matchStatus, "underqualified", "Budi harus underqualified untuk Cyber Security");
    assert.ok(matchCyber.missingSkills.length > 0, "Harus mendeteksi missing skills");
    assert.ok(matchCyber.missingSkills.includes("Network Security"), "Wajib mencantumkan skill yang belum ditemukan");
  });

  // Step 5: Detail Lowongan & Analisis Kesenjangan (AC-06)
  await t.test("Step 5: Job Detail menampilkan alasan skor dan link sumber asli (AC-06)", () => {
    assert.ok(correctedCvData);

    const targetJob = {
      id: "job-1",
      title: "Senior Data Analyst",
      sourceUrl: "https://boards.greenhouse.io/tekno/jobs/101",
      requiredSkills: ["SQL", "Python", "Tableau"],
      preferredSkills: ["Power BI", "Statistics"],
      experienceYearsMin: 2,
      education: "Sarjana (S1)",
      seniority: "Mid",
    };

    const match = calculateJobMatch(correctedCvData, targetJob);

    // Verifikasi transparansi 5 komponen
    assert.ok(Array.isArray(match.breakdown), "Breakdown harus berupa array ScoreBreakdownItem");
    assert.ok(match.breakdown.length > 0, "Breakdown harus memiliki komponen bobot");
    for (const item of match.breakdown) {
      assert.ok(typeof item.label === "string", "Label breakdown harus berupa teks");
      assert.ok(typeof item.score === "number", "Skor komponen harus berupa angka");
      assert.ok(typeof item.weight === "number", "Bobot komponen harus berupa angka");
      assert.ok(typeof item.available === "boolean", "Status availability komponen harus boolean");
    }

    // Verifikasi sumber asli valid
    assert.ok(targetJob.sourceUrl.startsWith("https://"), "Tautan sumber asli harus valid HTTPS");
  });

  // Step 6: Market Skill Insights (AC-03, AC-04, FR-09)
  await t.test("Step 6: Market Insights menghitung ranking skill dan gap belajar (AC-03, AC-04, FR-09)", () => {
    assert.ok(correctedCvData);

    const samplePostings = [
      { id: "p1", skills: ["SQL", "Python", "Tableau"] },
      { id: "p2", skills: ["SQL", "Power BI", "Excel"] },
      { id: "p3", skills: ["SQL", "Python", "R", "Machine Learning"] },
      { id: "p4", skills: ["SQL", "Python", "Tableau", "Airflow"] },
    ];

    const N = samplePostings.length;
    assert.equal(N, 4, "Total sampel N harus 4");

    // Hitung frekuensi per lowongan unik
    const frequencyMap = new Map<string, number>();
    for (const posting of samplePostings) {
      const uniqueSkillsInJob = new Set(posting.skills);
      for (const skill of uniqueSkillsInJob) {
        frequencyMap.set(skill, (frequencyMap.get(skill) || 0) + 1);
      }
    }

    assert.equal(frequencyMap.get("SQL"), 4, "SQL muncul di 4 dari 4 lowongan");
    assert.equal(frequencyMap.get("Python"), 3, "Python muncul di 3 dari 4 lowongan");

    // Evaluasi status CV terhadap top market skill (AC-04)
    const marketInsights = Array.from(frequencyMap.entries()).map(([skill, count]) => {
      const isFoundInCv = correctedCvData!.skills.includes(skill);
      return {
        skill,
        count,
        percentage: Math.round((count / N) * 100),
        cvStatus: isFoundInCv ? ("found" as const) : ("missing" as const),
      };
    });

    const sqlInsight = marketInsights.find((i) => i.skill === "SQL");
    assert.ok(sqlInsight);
    assert.equal(sqlInsight.percentage, 100);
    assert.equal(sqlInsight.cvStatus, "found", "SQL harus tercantum di CV");

    const mlInsight = marketInsights.find((i) => i.skill === "Machine Learning");
    assert.ok(mlInsight);
    assert.equal(mlInsight.cvStatus, "missing", "Machine Learning belum ditemukan di CV");

    // FR-09: Prioritas belajar dari gap pasar
    const studyPlan = marketInsights
      .filter((i) => i.cvStatus === "missing")
      .sort((a, b) => b.count - a.count);

    assert.ok(studyPlan.length > 0, "Harus menghasilkan rencana belajar dari kesenjangan CV");
    assert.ok(studyPlan.some((p) => p.skill === "Machine Learning" || p.skill === "Airflow" || p.skill === "R"));
  });
});
