import { test } from "node:test";
import { equal, ok, deepEqual } from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateJobMatch, getDisplayScore } from "../src/lib/matching.ts";
import { loadCandidateProfile } from "../src/lib/candidate-profile.ts";
import { mergeServerAndLocalJobs } from "../src/lib/tracker-storage.ts";
import { readFileSync } from "node:fs";
import { matchingRequirementText, requirementGroups, requirementLabel, requirementSummary } from "../src/lib/matching-requirements.ts";
import { getMatchStatusLabel } from "../src/lib/matching-config.ts";
import { getCanonicalSkill } from "../src/lib/matching-config.ts";
import { normalizeResumeSkills } from "../src/lib/resume-skill-normalization.ts";
import { canonicalSkillFrequencies } from "../src/lib/skill-frequency.ts";

const job = { title: "Data Analyst", requiredSkills: ["SQL", "Python"], experienceYearsMin: 2, seniority: "Junior" };
const candidate = { skills: ["SQL", "Python"], experienceYears: 2 };

test("Semua pasangan JLPT memakai urutan N1 tertinggi, N5 terendah", () => {
  for (let minimum = 1; minimum <= 5; minimum++) {
    for (let current = 1; current <= 5; current++) {
      const result = calculateJobMatch({ skills: ["SQL", `Japanese JLPT N${current}`], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["SQL", `Jepang (JLPT N${minimum})`] });
      equal(result.matchStatus, current <= minimum ? "match" : "underqualified", `CV N${current}, syarat N${minimum}`);
      const language = result.requirementsEvaluation.find((r) => r.skill.includes("JLPT"))!;
      if (current > minimum) {
        equal(language.statusLabel, "Di bawah minimum");
        equal(language.minimumNotMet, true);
        ok(result.factorsLimiting[0].includes(`JLPT N${current}`));
        ok(result.factorsLimiting[0].includes(`JLPT N${minimum}`));
      }
    }
  }
  const unknown = calculateJobMatch({ skills: ["SQL", "Bahasa Jepang"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["SQL", "JLPT N1"] });
  equal(unknown.matchStatus, "insufficient_evidence");
  const addedUpgrade = calculateJobMatch({ skills: ["SQL", "JLPT N5", "JLPT N1"], claimedSkills: ["JLPT N1"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["SQL", "JLPT N1"] });
  equal(addedUpgrade.matchStatus, "match");
  ok(addedUpgrade.requirementsEvaluation.find((r) => r.skill === "JLPT N1")?.addedByUser);
});

test("Level bahasa tambahan tidak menggagalkan syarat wajib dan bukti belum ditinjau tidak menaikkan level", () => {
  const result = calculateJobMatch({ skills: ["SQL", "JLPT N5"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["SQL"], preferredSkills: ["JLPT N1"] });
  equal(result.matchStatus, "match");
  ok(result.requirementsEvaluation.find((r) => r.skill === "JLPT N1")?.minimumNotMet);
  const pending = calculateJobMatch({ skills: ["SQL", "JLPT N1"], reviewSkills: ["JLPT N1"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["SQL", "JLPT N1"] });
  equal(pending.matchStatus, "insufficient_evidence");
});

test("Terjemahan skill yang sama cocok dan tidak menggandakan bobot", () => {
  const result = calculateJobMatch({ skills: ["Statistika", "Analisis Data"], experienceYears: 2 }, { title: "Analyst", requiredSkills: ["Statistics", "Statistik", "Data Analysis", "Data Analisis"] });
  equal(result.matchStatus, "match");
  equal(result.score, 100);
  equal(result.requirementsEvaluation.length, 2);
  deepEqual(result.matchedSkills, ["Statistics", "Data Analysis"]);
  equal(getCanonicalSkill("  data   analisis  "), getCanonicalSkill("Data Analysis"));
  ok(getCanonicalSkill("SQL") !== getCanonicalSkill("PostgreSQL"));
  ok(getCanonicalSkill("Data Analysis") !== getCanonicalSkill("Data Science"));
  ok(getCanonicalSkill("Statistics") !== getCanonicalSkill("Mathematics"));
});

test("Alias CV tidak menghilangkan cuplikan CV atau mengubah skill tambahan pengguna menjadi hasil baca CV", () => {
  const result = normalizeResumeSkills([
    { name: "Statistika", claimed: false, needsReview: false, evidence: "Proyek analisis dengan statistika." },
    { name: "Statistics", claimed: true, needsReview: false, evidence: null },
    { name: "Data Analisis", claimed: true, needsReview: false, evidence: null },
    { name: "Analisis Data", claimed: true, needsReview: false, evidence: null },
  ]);
  equal(result.length, 2);
  equal(result[0].name, "Statistics");
  equal(result[0].claimed, false);
  ok(result[0].evidence?.includes("statistika"));
  equal(result[1].name, "Data Analysis");
  equal(result[1].claimed, true);
});

test("Frekuensi pasar menggabungkan terjemahan pada level satu posting unik", () => {
  const row = (name: string, mandatory: boolean) => ({ skills: { name }, is_mandatory: mandatory });
  const result = canonicalSkillFrequencies([
    { job_skills: [row("Statistika", false), row("Statistics", true), row("Analisis Data", true), row("Data Analisis", false)] },
    { job_skills: [row("Statistik", true), row("Data Analysis", false)] },
  ]);
  equal(Object.keys(result).length, 2);
  equal(result.statistics.count, 2);
  equal(result.statistics.mandatoryCount, 2);
  equal(result["data analysis"].count, 2);
  equal(result["data analysis"].mandatoryCount, 1);
});

test("Amar: contoh alat dikelompokkan, BigQuery tetap tambahan dari Plus Point", () => {
  const seed = JSON.parse(readFileSync(new URL("../../worker/sources/jobs_seed.json", import.meta.url), "utf8"));
  const source = seed.find((j: { company: string; title: string }) => j.company === "Amar Bank" && j.title.includes("Digital Lending"));
  ok(source);
  const role = { title: source.title, requiredSkills: [...source.required_skills, "SPSS"], preferredSkills: ["BigQuery", "Looker"], description: source.description, experienceYearsMin: 3 };
  const input = { skills: ["Python", "Power BI", "Statistics", "Machine Learning", "Looker"], experienceYears: 3 };
  const detail = calculateJobMatch(input, role);
  equal(detail.matchStatus, "match");
  deepEqual(detail.missingSkills, []);
  deepEqual(detail.unprovenSkills, []);
  const analytics = detail.requirementsEvaluation.find((r) => r.exampleGroupLabel === "Alat analitik");
  ok(analytics);
  deepEqual(analytics.alternatives, ["BigQuery", "Python", "R", "SPSS"]);
  equal(analytics.matchedAlternative, "Python");
  ok(requirementSummary(analytics).includes("BigQuery"));
  ok(requirementSummary(analytics).includes("Python tercantum di CV"));
  const bigquery = detail.requirementsEvaluation.find((r) => r.skill === "BigQuery");
  equal(bigquery?.isMandatory, false);
  equal(bigquery?.status, "belum_ditemukan");
  ok(!detail.requirementsEvaluation.some((r) => r.skill === "R"));
  const cached = calculateJobMatch(input, { ...role, description: matchingRequirementText([...role.requiredSkills, ...role.preferredSkills], role.description) });
  deepEqual(cached, detail);
});

test("Contoh alat terbuka tidak menolak alat lain atau menggabungkan konsep dan daftar wajib biasa", () => {
  const open = calculateJobMatch({ skills: ["SAS"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["Python", "SPSS"], description: "Use analytics tool (e.g.: Python, SPSS, etc)." });
  equal(open.matchStatus, "insufficient_evidence");
  deepEqual(open.missingSkills, []);
  const ordinary = calculateJobMatch({ skills: ["Python", "Statistics"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["Python", "R", "Statistics", "Machine Learning"], description: "Required: Python and R. Data mining concepts (Eg: Statistics, Machine Learning, etc)." });
  equal(ordinary.matchStatus, "underqualified");
  ok(ordinary.missingSkills.includes("R"));
  ok(ordinary.requirementsEvaluation.some((r) => r.skill === "Machine Learning"));
  const explicit = calculateJobMatch({ skills: ["Python"], experienceYears: 3 }, { title: "Analyst", requiredSkills: ["Python", "BigQuery"], description: "Use analytics tool (Eg: Big Query, Python, etc). BigQuery is required." });
  equal(explicit.matchStatus, "underqualified");
  ok(explicit.missingSkills.includes("BigQuery"));
});

test("Mandarin HSK 5 wajib muncul sebagai gap dan tidak tertutup skill teknis", () => {
  const result = calculateJobMatch({ skills: ["SQL", "Excel"], experienceYears: 2 }, { title: "Mandarin Speaker Analyst", requiredSkills: ["SQL", "Mandarin (HSK 5)"] });
  equal(result.matchStatus, "underqualified");
  deepEqual(result.missingSkills, ["Mandarin (HSK 5)"]);
  equal(result.requirementsEvaluation.find((r) => r.skill.includes("HSK"))?.isMandatory, true);
  ok(result.factorsLimiting[0].includes("Mandarin (HSK 5)"));
});

test("HSK minimum membandingkan level, sedangkan Mandarin umum memerlukan bukti level", () => {
  const role = { title: "Analyst", requiredSkills: ["SQL", "Mandarin (HSK 5)"] };
  for (const skill of ["HSK 5", "HSK Level 6", "Mandarin (HSK 5)"]) {
    const result = calculateJobMatch({ skills: ["SQL", skill], experienceYears: 2 }, role);
    equal(result.matchStatus, "match", skill);
    equal(result.missingSkills.length, 0);
  }
  const low = calculateJobMatch({ skills: ["SQL", "Mandarin", "HSK 4"], experienceYears: 2 }, role);
  equal(low.matchStatus, "underqualified");
  ok(low.requirementsEvaluation.find((r) => r.skill.includes("HSK"))?.evidence.includes("HSK Level 4"));
  const generic = calculateJobMatch({ skills: ["SQL", "Bahasa Mandarin"], experienceYears: 2 }, role);
  equal(generic.matchStatus, "insufficient_evidence");
  deepEqual(generic.unprovenSkills, ["Mandarin (HSK 5)"]);
  const added = calculateJobMatch({ skills: ["SQL", "HSK 6"], claimedSkills: ["HSK 6"], experienceYears: 2 }, role);
  equal(added.matchStatus, "match");
});

test("Ekstraksi belum ditinjau menurunkan nilai, sedangkan skill tambahan pengguna dihitung penuh", () => {
  const proven = calculateJobMatch(candidate, job);
  const pending = calculateJobMatch({ ...candidate, reviewSkills: ["SQL"] }, job);
  ok(pending.score < proven.score);
  equal(pending.matchStatus, "insufficient_evidence");
  equal(pending.breakdown.find((part) => part.label === "Skill Wajib")?.notes, "1/2 terpenuhi");

  const addedOnly = calculateJobMatch({ ...candidate, claimedSkills: candidate.skills }, job);
  equal(addedOnly.score, proven.score);
  equal(addedOnly.matchStatus, proven.matchStatus);
  ok(addedOnly.requirementsEvaluation.every((r) => r.addedByUser));
});

test("Kekurangan pengalaman, pendidikan, dan IPK tidak ditutupi skor skill", () => {
  equal(calculateJobMatch({ ...candidate, experienceYears: 1 }, job).matchStatus, "underqualified");
  equal(calculateJobMatch({ ...candidate, education: "S1", gpa: 3.5 }, { ...job, education: "S2", minGpa: 3 }).matchStatus, "underqualified");
  equal(calculateJobMatch({ ...candidate, education: "S1", gpa: 2.5 }, { ...job, education: "S1", minGpa: 3 }).matchStatus, "underqualified");
});

test("Overkualifikasi memerlukan kecocokan wajib dan bukti posisi junior", () => {
  equal(calculateJobMatch({ ...candidate, experienceYears: 8 }, job).matchStatus, "potentially_overqualified");
  equal(calculateJobMatch({ skills: ["SQL"], experienceYears: 8 }, job).matchStatus, "underqualified");
  equal(calculateJobMatch({ ...candidate, experienceYears: 8 }, { ...job, seniority: "Senior" }).matchStatus, "match");
  equal(calculateJobMatch({ ...candidate, experienceYears: 8 }, { ...job, seniority: null }).matchStatus, "match");
});

test("Data kosong tidak diasumsikan S1 atau diberi nilai semantik rekaan", () => {
  const result = calculateJobMatch({ skills: ["SQL"], experienceYears: null }, { title: "SQL Analyst", requiredSkills: ["SQL"], education: "S1" });
  equal(result.breakdown.find((part) => part.label === "Pendidikan & IPK")?.available, false);
  equal(result.breakdown.find((part) => part.label === "Kesesuaian Semantik")?.available, false);
  equal(result.score, 100);
  equal(result.matchStatus, "insufficient_evidence");
  equal(getDisplayScore(result), null);
  const withSemantic = calculateJobMatch(candidate, { ...job, semanticSimilarity: 0.4 });
  equal(withSemantic.breakdown.find((part) => part.label === "Kesesuaian Semantik")?.score, 40);
});

test("Satu dari lima skill wajib belum ditemukan tetap menjadi gap meski skor 88", () => {
  const result = calculateJobMatch({ skills: ["SQL", "Python", "Machine Learning", "Deep Learning"], experienceYears: 2, education: "S1" }, {
    title: "Data Analyst", requiredSkills: ["SQL", "Python", "R", "Machine Learning", "Deep Learning"],
    experienceYearsMin: 2, education: "S1", seniority: "Mid",
  });
  equal(result.score, 88); // (0.35 × 0.8 + 0.15 + 0.10) / 0.60
  equal(result.matchStatus, "underqualified");
  deepEqual(result.missingSkills, ["R"]);
});

test("Kredivo: Python/R dari deskripsi asli adalah alternatif, bukan dua kewajiban", () => {
  const seed = JSON.parse(readFileSync(new URL("../../worker/sources/jobs_seed.json", import.meta.url), "utf8"));
  const source = seed.find((j: { company: string; title: string }) => j.company === "Kredivo Group" && j.title === "Data Analyst Operations");
  ok(source);
  for (const language of ["Python", "R"]) {
    const input = { skills: ["SQL", language, "Machine Learning", "Deep Learning"], experienceYears: 2, education: "S1" };
    const profile = { title: source.title, description: source.description, requiredSkills: source.required_skills, experienceYearsMin: 2, education: "S1", seniority: "Mid" };
    const detail = calculateJobMatch(input, profile);
    const cachedText = requirementGroups(profile.requiredSkills, profile.description).filter((g) => g.length > 1).map((g) => g.join(" / ")).join("\n");
    const list = calculateJobMatch(input, { ...profile, description: cachedText });
    equal(detail.matchStatus, "match");
    equal(detail.score, 100);
    deepEqual(detail.missingSkills, []);
    equal(detail.requirementsEvaluation.length, 4);
    ok(detail.requirementsEvaluation.some((r) => r.skill === "Python / R" && r.evidence.includes("cukup salah satu")));
    const alternative = detail.requirementsEvaluation.find((r) => r.alternatives?.length);
    ok(alternative);
    equal(alternative.isMandatory, true);
    equal(alternative.matchedAlternative, language);
    equal(requirementLabel(alternative), "Python atau R");
    equal(requirementSummary(alternative), `Python atau R — terpenuhi melalui ${language}`);
    ok(!detail.unprovenSkills.includes(language === "Python" ? "R" : "Python"));
    deepEqual(list, detail);
  }
});

test("Alternatif hanya berlaku jika sumber menulis /, or, atau; and tetap dua syarat", () => {
  for (const separator of ["/", " or ", " atau "]) {
    const result = calculateJobMatch({ skills: ["Python"], experienceYears: null }, { title: "Analyst", requiredSkills: ["Python", "R"], description: `Knowledge of Python${separator}R.` });
    equal(result.matchStatus, "match");
  }
  for (const description of ["Python and R", "Python dan R", "Python, R", "Python. R.", "Python or Rust", "Python or Ruby"]) {
    const result = calculateJobMatch({ skills: ["Python"], experienceYears: null }, { title: "Analyst", requiredSkills: ["Python", "R"], description });
    equal(result.matchStatus, "underqualified", description);
  }
});

test("Power BI pada Pangan Lestari tidak dianggap cocok hanya karena ada Excel", () => {
  const seed = JSON.parse(readFileSync(new URL("../../worker/sources/jobs_seed.json", import.meta.url), "utf8"));
  const source = seed.find((j: { company: string }) => j.company === "PT Pangan Lestari");
  const result = calculateJobMatch({ skills: ["Excel"], experienceYears: 2, education: "S1" }, {
    title: source.title, description: source.description, requiredSkills: source.job_skills.map((s: { skills: { name: string } }) => s.skills.name), experienceYearsMin: 1, education: "Bachelor",
  });
  equal(result.breakdown.find((b) => b.label === "Skill Wajib")?.score, 50);
  deepEqual(result.unprovenSkills, []);
  ok(result.missingSkills.includes("Power BI"));
  equal(result.matchStatus, "underqualified");
});

test("Deskripsi generik Kredivo tidak menghasilkan klaim hijau meski semua skill tercantum", () => {
  const input = { skills: ["SQL", "Python", "R", "Machine Learning", "Deep Learning"], experienceYears: 2 };
  const profile = { title: "Data Analyst Operations", requiredSkills: input.skills, description: "Data Analyst Operations di Kredivo Group. Deskripsi kualifikasi lowongan." };
  const detail = calculateJobMatch(input, profile);
  const list = calculateJobMatch(input, { ...profile, description: "", requirementsNeedReview: true });
  equal(detail.matchStatus, "insufficient_evidence");
  equal(detail.matchStatusReason, "job_data_incomplete");
  equal(getMatchStatusLabel(detail.matchStatus, detail.matchStatusReason), "Data lowongan belum lengkap");
  equal(getDisplayScore(detail), null);
  ok(detail.factorsLimiting.some((f) => f.includes("Deskripsi persyaratan lowongan belum lengkap")));
  deepEqual(list, detail);
});

test("Syarat alternatif berlaku juga untuk skill tambahan tanpa mengubahnya menjadi wajib", () => {
  const result = calculateJobMatch({ skills: ["SQL", "Power BI"], experienceYears: 2 }, {
    title: "BI Analyst", requiredSkills: ["SQL"], preferredSkills: ["Power BI", "Tableau"], description: "SQL wajib. Nilai tambah: Power BI atau Tableau.",
  });
  equal(result.score, 100);
  equal(result.matchStatus, "match");
  const alternative = result.requirementsEvaluation.find((r) => r.alternatives?.length);
  ok(alternative);
  equal(alternative.isMandatory, false);
  equal(alternative.matchedAlternative, "Power BI");
  deepEqual(result.missingSkills, []);
});

test("Syarat Python/R bisa terpenuhi sementara pengalaman wajib tetap menjadi gap", () => {
  const result = calculateJobMatch({ skills: ["SQL", "Python"], experienceYears: 0 }, {
    title: "Analyst", requiredSkills: ["SQL", "Python", "R"], description: "SQL and Python/R. At least 2 years of experience.", experienceYearsMin: 2,
  });
  equal(result.matchStatus, "underqualified");
  deepEqual(result.missingSkills, []);
  deepEqual(result.unprovenSkills, []);
  ok(result.factorsLimiting[0].includes("Pengalaman kerja"));
  equal(result.requirementsEvaluation.find((r) => r.alternatives)?.status, "cocok");
});

test("Bukti CV yang belum ditinjau diberi label berbeda dari data lowongan yang belum lengkap", () => {
  const result = calculateJobMatch({ ...candidate, reviewSkills: ["SQL"] }, job);
  equal(result.matchStatusReason, "cv_data_incomplete");
  equal(getMatchStatusLabel(result.matchStatus, result.matchStatusReason), "Bukti CV belum cukup");
});

test("Gap pengalaman tetap tampak walau semua skill cocok dan skor tinggi", () => {
  const result = calculateJobMatch({ skills: ["SQL"], experienceYears: 1.5, education: "S1" }, { title: "Analyst", requiredSkills: ["SQL"], experienceYearsMin: 2, education: "S1" });
  equal(result.score, 94);
  equal(result.matchStatus, "underqualified");
  ok(result.factorsLimiting.some((f) => f.includes("Pengalaman kerja") && f.includes("minimum")));
  const optionalGap = calculateJobMatch({ skills: ["SQL"], experienceYears: 1.5 }, { title: "Analyst", requiredSkills: ["SQL"], preferredSkills: ["Rust"], experienceYearsMin: 2 });
  equal(optionalGap.matchStatus, "underqualified");
  ok(optionalGap.factorsLimiting[0].includes("Pengalaman kerja"), "Alasan utama kartu harus gap wajib, bukan skill tambahan");
});

test("Skill tambahan menurunkan skor tanpa menggagalkan skill wajib yang sudah cocok", () => {
  const result = calculateJobMatch({ skills: ["SQL"], experienceYears: null }, { title: "Analyst", requiredSkills: ["SQL"], preferredSkills: ["Rust", "Go"] });
  equal(result.score, 64);
  equal(result.matchStatus, "match");
  deepEqual(result.missingSkills, []);
  ok(result.factorsLimiting.some((f) => f.includes("tambahan")));
});

test("Alias dan duplikat tidak menggandakan bobot; skill wajib mengalahkan tambahan", () => {
  const input = { skills: ["Excel", "SQL"], experienceYears: 1 };
  const base = { title: "Analyst", requiredSkills: ["Excel", "SQL", "Rust"], preferredSkills: ["Go"] };
  const clean = calculateJobMatch(input, base);
  const duplicate = calculateJobMatch(input, { ...base, requiredSkills: ["Excel", "Microsoft Excel", "SQL", "Rust", "Rust", " "], preferredSkills: ["SQL", "Go", "Go"] });
  equal(duplicate.score, clean.score);
  equal(duplicate.requirementsEvaluation.length, 4);
  equal(duplicate.matchStatus, clean.matchStatus);
});

test("Data minimum yang belum diketahui tidak dianggap terpenuhi atau dihitung nol", () => {
  for (const missing of [
    { candidate: { skills: ["SQL"], experienceYears: null, education: "S1", gpa: 3.5 }, job: { experienceYearsMin: 2 } },
    { candidate: { skills: ["SQL"], experienceYears: 2, education: "", gpa: 3.5 }, job: { education: "Bachelor" } },
    { candidate: { skills: ["SQL"], experienceYears: 2, education: "S1" }, job: { minGpa: 3 } },
  ]) {
    const result = calculateJobMatch(missing.candidate, { title: "Analyst", requiredSkills: ["SQL"], ...missing.job });
    equal(result.score, 100);
    equal(result.matchStatus, "insufficient_evidence");
    equal(getDisplayScore(result), null);
    ok(result.factorsLimiting.some((f) => /belum tersedia|belum cukup/.test(f)));
  }
});

test("Tidak mengarang minimum dua tahun dari label Mid atau menolak D3 pada D3/S1", () => {
  const result = calculateJobMatch({ skills: ["SQL"], experienceYears: 1, education: "D3" }, { title: "Analyst", requiredSkills: ["SQL"], experienceYearsMin: 1, seniority: "Mid", education: "D3/S1" });
  equal(result.matchStatus, "match");
  equal(result.score, 100);
});

test("Skor nol tetap nol; menambah bukti tidak menurunkan skor; bobot tepat 100", () => {
  const profile = { title: "Analyst", requiredSkills: ["SQL", "Rust"], preferredSkills: ["Go"], experienceYearsMin: 2, education: "S1", semanticSimilarity: 0.5 };
  const none = calculateJobMatch({ skills: ["Canva"], experienceYears: 0 }, { title: "Analyst", requiredSkills: ["SQL"], experienceYearsMin: 2 });
  equal(none.score, 0);
  const partial = calculateJobMatch({ skills: ["SQL"], experienceYears: 1, education: "S1" }, profile);
  const full = calculateJobMatch({ skills: ["SQL", "Rust", "Go"], experienceYears: 2, education: "S1" }, profile);
  ok(full.score >= partial.score);
  for (const result of [partial, full, none]) {
    equal(result.breakdown.reduce((sum, b) => sum + b.weight, 0), 100);
    const reconstructed = result.breakdown.reduce((sum, b) => sum + b.score * b.weight / 100, 0);
    ok(Math.abs(reconstructed - result.score) <= 1);
    ok(result.score >= 0 && result.score <= 100);
  }
});

test("Perhitungan tidak memberi bonus khusus pada skill bidang data", () => {
  const data = calculateJobMatch({ skills: ["SQL"], experienceYears: 2 }, { title: "Data Analyst", requiredSkills: ["SQL"] });
  const marketing = calculateJobMatch({ skills: ["SEO"], experienceYears: 2 }, { title: "SEO Specialist", requiredSkills: ["SEO"] });
  equal(data.score, marketing.score);
  equal(data.matchStatus, marketing.matchStatus);
});

test("Guest tidak memuat profil; user dan admin hanya menerima CV milik akun sendiri", async () => {
  const scopes: string[] = [];
  const db = {
    from(table: string) {
      let id = "";
      return {
        select() { return this; },
        eq(key: string, value: string) { if (key === "id" || key === "user_id") id = value; return this; },
        async single() { return { data: { target_role: "Data Analyst" }, error: null }; },
        async maybeSingle() {
          scopes.push(`${table}:${id}`);
          return { data: id === "admin" ? null : { id: `cv-${id}`, experience_years: 2, education: "S1", resume_skills: [{ skills: { name: id === "user-a" ? "SQL" : "Python" }, is_claimed_by_user: false, needs_review: false, evidence: "Cuplikan CV." }] }, error: null };
        },
      };
    },
  } as unknown as SupabaseClient;
  const guest = await loadCandidateProfile(db, null);
  equal(guest.activeResume, null);
  deepEqual(scopes, []);
  const [a, b, admin] = await Promise.all([loadCandidateProfile(db, "user-a"), loadCandidateProfile(db, "user-b"), loadCandidateProfile(db, "admin")]);
  deepEqual(a.skills, ["SQL"]);
  deepEqual(b.skills, ["Python"]);
  equal(admin.activeResume, null);
  deepEqual(admin.skills, []);
  deepEqual(scopes.sort(), ["resumes:admin", "resumes:user-a", "resumes:user-b"]);
});

test("Tracker tanpa nilai dari server tidak membuat skor atau skill bawaan", () => {
  const [result] = mergeServerAndLocalJobs([{ id: "job-1", title: "Data Analyst", company: "Contoh", location: "Jakarta", matchScore: null }], "user-a");
  equal(result.matchStatus, "insufficient_evidence");
  equal(result.matchScore, 0);
  deepEqual(result.matchedSkills, []);
  equal(result.seniority, undefined);
  equal(result.employmentType, "Tipe kerja belum diinformasikan");
  equal(result.salaryExpectation, "");
});

test("Filter level memakai label judul, lalu syarat pengalaman bila judul tanpa level", async () => {
  const { matchesJobLevel } = await import("../src/lib/job-level.ts");
  ok(matchesJobLevel("Senior", 1, "Senior"));
  ok(!matchesJobLevel("Senior", 1, "Junior"));
  ok(matchesJobLevel(null, 0, "Junior"));
  ok(matchesJobLevel("", 1.5, "Junior"));
  ok(matchesJobLevel(null, 2, "Mid"));
  ok(!matchesJobLevel(null, 4, "Mid"));
  ok(matchesJobLevel(null, 4, "Senior"));
  ok(!matchesJobLevel(null, null, "Junior"));
  ok(!matchesJobLevel(null, 5, "Lead"));
  ok(matchesJobLevel("Internship", null, "Internship"));
  ok(matchesJobLevel(null, null, "all"));
});
