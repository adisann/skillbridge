import {
  DEFAULT_MATCHING_WEIGHTS,
  DEFAULT_MATCHING_THRESHOLDS,
  RELATED_SKILLS_MAP,
  type MatchingWeights,
  type MatchingThresholds,
} from "./matching-config.ts";

export type MatchCategory =
  | "match"
  | "underqualified"
  | "potentially_overqualified"
  | "insufficient_evidence";

export type RequirementStatus = "cocok" | "belum_ditemukan" | "belum_cukup_bukti";

export interface RequirementEvaluation {
  id: string;
  skill: string;
  isMandatory: boolean;
  status: RequirementStatus;
  statusLabel: "Cocok di CV" | "Belum ditemukan di CV" | "Belum cukup bukti";
  evidence: string;
}

export interface ScoreBreakdownItem {
  label: string;
  score: number; // 0 - 100
  weight: number; // Persentase bobot efektif terdistribusi (0 - 100)
  available: boolean;
  notes?: string;
}

export interface MatchResult {
  score: number; // Skor estimasi akhir 0 - 100
  matchStatus: MatchCategory;
  matchedSkills: string[];
  missingSkills: string[];
  unprovenSkills: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
  breakdown: ScoreBreakdownItem[];
  requirementsEvaluation: RequirementEvaluation[];
}

export interface CandidateProfileInput {
  skills: string[];
  experienceYears: number;
  education?: string | null;
  targetRole?: string | null;
}

export interface JobProfileInput {
  title: string;
  canonicalTitle?: string | null;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYearsMin?: number | null;
  education?: string | null;
  seniority?: string | null;
}

/**
 * Menghitung kecocokan hybrid antara profil kandidat dan lowongan pekerjaan.
 * Mematuhi:
 * 1. Redistribusi bobot proporsional untuk komponen tanpa data (tidak dihitung 0).
 * 2. AC-02: Membedakan status skill menjadi 'cocok', 'belum ditemukan', dan 'belum cukup bukti'.
 * 3. AC-05: Menghasilkan kategori Match, Underqualified, Potentially Overqualified, dan Insufficient Evidence.
 * 4. Aturan kebahasaan: Menggunakan "belum ditemukan", bukan "tidak punya".
 */
export function calculateJobMatch(
  candidate: CandidateProfileInput | string[],
  candidateYearsOrJob: number | JobProfileInput,
  candidateEducation?: string | null,
  jobInput?: JobProfileInput,
  customWeights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS,
  customThresholds: MatchingThresholds = DEFAULT_MATCHING_THRESHOLDS
): MatchResult {
  // Normalisasi argumen untuk mendukung signature lama (skills, years, education, job)
  let candidateSkills: string[] = [];
  let candidateYears = 0;
  let candidateEdu = "Sarjana (S1)";
  let candidateTargetRole = "Data Analyst";
  let job: JobProfileInput;

  if (Array.isArray(candidate)) {
    candidateSkills = candidate;
    candidateYears = typeof candidateYearsOrJob === "number" ? candidateYearsOrJob : 0;
    candidateEdu = candidateEducation || "Sarjana (S1)";
    job = (jobInput || {}) as JobProfileInput;
  } else {
    candidateSkills = candidate.skills || [];
    candidateYears = candidate.experienceYears || 0;
    candidateEdu = candidate.education || "Sarjana (S1)";
    candidateTargetRole = candidate.targetRole || "Data Analyst";
    job = candidateYearsOrJob as JobProfileInput;
  }

  const normCandidateSkills = new Set(
    candidateSkills.map((s) => s.trim().toLowerCase())
  );

  // Evaluasi Insufficient Evidence di awal
  const isCandidateEmpty =
    candidateSkills.length === 0 ||
    (candidateSkills.length < customThresholds.insufficientEvidenceMinSkills && candidateYears === 0);

  // ---------------------------------------------------------------------------
  // 1. Evaluasi Persyaratan Wajib (Mandatory Skills) & AC-02
  // ---------------------------------------------------------------------------
  const reqSkills = job.requiredSkills || [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const unprovenSkills: string[] = [];
  const requirementsEvaluation: RequirementEvaluation[] = [];

  let mandatoryScore = 1.0;
  let mandatoryRatio = 1.0;
  const isMandatoryAvailable = reqSkills.length > 0;

  if (isMandatoryAvailable) {
    let earnedPoints = 0;

    for (let i = 0; i < reqSkills.length; i++) {
      const skillName = reqSkills[i].trim();
      const skillLower = skillName.toLowerCase();
      let status: RequirementStatus = "belum_ditemukan";
      let statusLabel: RequirementEvaluation["statusLabel"] = "Belum ditemukan di CV";
      let evidence = "Belum ditemukan penyebutan skill ini di CV pelamar.";

      if (normCandidateSkills.has(skillLower)) {
        status = "cocok";
        statusLabel = "Cocok di CV";
        evidence = `Tercantum pada kualifikasi CV pelamar.`;
        matchedSkills.push(skillName);
        earnedPoints += 1.0;
      } else {
        // Cek apakah ada bukti kemampuan serumpun (AC-02: Belum cukup bukti)
        const related = RELATED_SKILLS_MAP[skillLower] || [];
        const foundRelated = related.find((r) => normCandidateSkills.has(r.toLowerCase()));

        if (foundRelated) {
          status = "belum_cukup_bukti";
          statusLabel = "Belum cukup bukti";
          evidence = `CV memuat kompetensi serumpun (${foundRelated}), namun belum ada rincian bukti penggunaan alat ini secara spesifik.`;
          unprovenSkills.push(skillName);
          earnedPoints += 0.5; // Bobot parsial untuk bukti terkait
        } else {
          missingSkills.push(skillName);
        }
      }

      requirementsEvaluation.push({
        id: `req-m-${i}`,
        skill: skillName,
        isMandatory: true,
        status,
        statusLabel,
        evidence,
      });
    }

    mandatoryScore = earnedPoints / reqSkills.length;
    mandatoryRatio = matchedSkills.length / reqSkills.length;
  }

  // ---------------------------------------------------------------------------
  // 2. Evaluasi Persyaratan Tambahan (Preferred Skills)
  // ---------------------------------------------------------------------------
  const prefSkills = job.preferredSkills || [];
  let preferredScore = 1.0;
  const isPreferredAvailable = prefSkills.length > 0;

  if (isPreferredAvailable) {
    let earnedPoints = 0;

    for (let i = 0; i < prefSkills.length; i++) {
      const skillName = prefSkills[i].trim();
      const skillLower = skillName.toLowerCase();
      let status: RequirementStatus = "belum_ditemukan";
      let statusLabel: RequirementEvaluation["statusLabel"] = "Belum ditemukan di CV";
      let evidence = "Belum ditemukan pada dokumen CV.";

      if (normCandidateSkills.has(skillLower)) {
        status = "cocok";
        statusLabel = "Cocok di CV";
        evidence = "Tercantum pada kualifikasi CV pelamar.";
        if (!matchedSkills.includes(skillName)) matchedSkills.push(skillName);
        earnedPoints += 1.0;
      } else {
        const related = RELATED_SKILLS_MAP[skillLower] || [];
        const foundRelated = related.find((r) => normCandidateSkills.has(r.toLowerCase()));

        if (foundRelated) {
          status = "belum_cukup_bukti";
          statusLabel = "Belum cukup bukti";
          evidence = `CV memuat kompetensi pendukung (${foundRelated}), namun belum tercantum alat ini secara spesifik.`;
          if (!unprovenSkills.includes(skillName)) unprovenSkills.push(skillName);
          earnedPoints += 0.5;
        }
      }

      requirementsEvaluation.push({
        id: `req-p-${i}`,
        skill: skillName,
        isMandatory: false,
        status,
        statusLabel,
        evidence,
      });
    }

    preferredScore = earnedPoints / prefSkills.length;
  }

  // ---------------------------------------------------------------------------
  // 3. Evaluasi Pengalaman Kerja (Experience)
  // ---------------------------------------------------------------------------
  const minYears = job.experienceYearsMin || 0;
  const isExpAvailable = minYears > 0;
  let expScore = 1.0;

  if (isExpAvailable) {
    if (candidateYears >= minYears) {
      expScore = 1.0;
    } else {
      expScore = Math.max(0.15, candidateYears / minYears);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Evaluasi Pendidikan & Senioritas
  // ---------------------------------------------------------------------------
  const isEduAvailable = Boolean(job.education || job.seniority);
  let eduScore = 1.0;

  if (isEduAvailable) {
    let eduComponent = 1.0;
    if (job.education) {
      const jEdu = job.education.toLowerCase();
      const cEdu = candidateEdu.toLowerCase();
      if (cEdu.includes("s1") || cEdu.includes("bachelor") || cEdu.includes("sarjana") || cEdu.includes("s2") || cEdu.includes("master")) {
        eduComponent = 1.0;
      } else if (jEdu.includes("s1") || jEdu.includes("bachelor") || jEdu.includes("sarjana")) {
        eduComponent = 0.65;
      }
    }

    let seniorityComponent = 1.0;
    if (job.seniority) {
      const jSen = job.seniority.toLowerCase();
      if (jSen.includes("senior") || jSen.includes("lead")) {
        seniorityComponent = candidateYears >= 4 ? 1.0 : candidateYears >= 2 ? 0.65 : 0.40;
      } else if (jSen.includes("junior") || jSen.includes("entry")) {
        seniorityComponent = 1.0;
      }
    }

    eduScore = (eduComponent + seniorityComponent) / 2;
  }

  // ---------------------------------------------------------------------------
  // 5. Evaluasi Kesesuaian Semantik / Relevansi Role
  // ---------------------------------------------------------------------------
  const isSemanticAvailable = true; // Selalu tersedia
  const titleLower = (job.title || "").toLowerCase();
  const canonicalLower = (job.canonicalTitle || "").toLowerCase();
  const targetLower = candidateTargetRole.toLowerCase();

  const isRoleMatching =
    titleLower.includes(targetLower) ||
    canonicalLower.includes(targetLower) ||
    (targetLower.includes("analyst") && (titleLower.includes("analyst") || canonicalLower.includes("analyst")));

  const coreDataSkills = ["sql", "python", "tableau", "power bi", "excel", "metabase", "statistics"];
  const candidateCoreDataCount = Array.from(normCandidateSkills).filter((s) => coreDataSkills.includes(s)).length;

  let semanticScore = 0.55;
  if (isRoleMatching && candidateCoreDataCount >= 2) {
    semanticScore = 0.95;
  } else if (isRoleMatching || candidateCoreDataCount >= 1) {
    semanticScore = 0.78;
  }

  // ---------------------------------------------------------------------------
  // 6. Redistribusi Bobot Proporsional (Komponen tanpa data TIDAK dihitung nol)
  // ---------------------------------------------------------------------------
  const activeComponents: Array<{
    key: keyof MatchingWeights;
    label: string;
    score: number;
    baseWeight: number;
    available: boolean;
    notes?: string;
  }> = [
    {
      key: "mandatorySkills",
      label: "Skill Wajib",
      score: mandatoryScore,
      baseWeight: customWeights.mandatorySkills,
      available: isMandatoryAvailable,
      notes: isMandatoryAvailable ? `${matchedSkills.length}/${reqSkills.length} terpenuhi` : "Tidak disyaratkan secara spesifik",
    },
    {
      key: "preferredSkills",
      label: "Skill Tambahan",
      score: preferredScore,
      baseWeight: customWeights.preferredSkills,
      available: isPreferredAvailable,
      notes: isPreferredAvailable ? `${prefSkills.length} skill tambahan dievaluasi` : "Tidak ada kualifikasi tambahan",
    },
    {
      key: "experience",
      label: "Pengalaman Kerja",
      score: Math.min(expScore, 1.0),
      baseWeight: customWeights.experience,
      available: isExpAvailable,
      notes: isExpAvailable ? `Syarat: ${minYears} thn, CV: ${candidateYears} thn` : "Tidak mensyaratkan durasi minimum",
    },
    {
      key: "educationSeniority",
      label: "Pendidikan & Level",
      score: eduScore,
      baseWeight: customWeights.educationSeniority,
      available: isEduAvailable,
      notes: isEduAvailable ? `${job.education || "Pendidikan umum"} • ${job.seniority || "Semua level"}` : "Kualifikasi terbuka untuk umum",
    },
    {
      key: "semantic",
      label: "Kesesuaian Semantik",
      score: semanticScore,
      baseWeight: customWeights.semantic,
      available: isSemanticAvailable,
      notes: "Relevansi terminologi dan domain pekerjaan",
    },
  ];

  // Hitung total bobot dari komponen yang tersedia
  const totalActiveWeight = activeComponents
    .filter((c) => c.available)
    .reduce((sum, c) => sum + c.baseWeight, 0);

  let rawWeightedScore = 0;
  const breakdown: ScoreBreakdownItem[] = [];

  for (const comp of activeComponents) {
    if (comp.available && totalActiveWeight > 0) {
      // Bobot dinormalisasi ulang agar totalnya 1.0 (100%)
      const effectiveWeightRatio = comp.baseWeight / totalActiveWeight;
      const effectiveWeightPercent = Math.round(effectiveWeightRatio * 100);
      rawWeightedScore += effectiveWeightRatio * comp.score;

      breakdown.push({
        label: comp.label,
        score: Math.round(comp.score * 100),
        weight: effectiveWeightPercent,
        available: true,
        notes: comp.notes,
      });
    } else {
      breakdown.push({
        label: comp.label,
        score: Math.round(comp.score * 100),
        weight: 0,
        available: false,
        notes: comp.notes,
      });
    }
  }

  const finalScore = isCandidateEmpty ? 15 : Math.min(100, Math.max(5, Math.round(rawWeightedScore * 100)));

  // ---------------------------------------------------------------------------
  // 7. Penentuan Kategori Status & Faktor Pendukung / Pembatas
  // ---------------------------------------------------------------------------
  let matchStatus: MatchCategory = "match";
  const factorsSupporting: string[] = [];
  const factorsLimiting: string[] = [];

  // Faktor Pendukung
  if (matchedSkills.length > 0) {
    factorsSupporting.push(
      `Memenuhi ${matchedSkills.length} kualifikasi skill utama yang tercantum di lowongan (${matchedSkills.slice(0, 3).join(", ")})`
    );
  }
  if (isExpAvailable && candidateYears >= minYears) {
    factorsSupporting.push(
      `Pengalaman kerja (${candidateYears} tahun) memenuhi kualifikasi minimum yang disyaratkan (${minYears} tahun)`
    );
  }
  if (semanticScore >= 0.8) {
    factorsSupporting.push(
      `Profil keahlian sangat relevan dengan bidang data dan analitik yang dicari perusahaan`
    );
  }

  // Faktor Pembatas (Skill Gap & Pengalaman)
  if (missingSkills.length > 0) {
    factorsLimiting.push(
      `Skill wajib ${missingSkills.slice(0, 4).join(", ")} belum ditemukan di CV`
    );
  }
  if (unprovenSkills.length > 0) {
    factorsLimiting.push(
      `Skill ${unprovenSkills.slice(0, 3).join(", ")} belum memuat bukti spesifik (hanya ditemukan kompetensi serumpun)`
    );
  }
  if (isExpAvailable && candidateYears < minYears) {
    factorsLimiting.push(
      `Pengalaman kerja (${candidateYears} tahun) belum mencapai kualifikasi minimum lowongan (${minYears} tahun)`
    );
  }

  // Klasifikasi Kategori
  if (isCandidateEmpty) {
    matchStatus = "insufficient_evidence";
    factorsLimiting.unshift("CV belum memuat informasi kualifikasi atau keterampilan teknis yang cukup untuk dievaluasi");
  } else if (
    isExpAvailable &&
    candidateYears >= minYears + customThresholds.overqualifiedMinExperienceDiff &&
    finalScore >= 65
  ) {
    matchStatus = "potentially_overqualified";
    factorsSupporting.push(
      `Pengalaman kerja (${candidateYears} tahun) melampaui level kualifikasi peran ini (${minYears} tahun) — indikasi overkualifikasi tentatif`
    );
  } else if (
    finalScore >= customThresholds.matchScoreMin &&
    (!isMandatoryAvailable || mandatoryRatio >= customThresholds.mandatoryRatioMin)
  ) {
    matchStatus = "match";
  } else {
    matchStatus = "underqualified";
  }

  if (factorsSupporting.length === 0) {
    factorsSupporting.push("Belum ada faktor pendukung kuat yang teridentifikasi dari CV");
  }
  if (factorsLimiting.length === 0) {
    factorsLimiting.push("Seluruh kualifikasi wajib dan tambahan terpenuhi dengan baik");
  }

  return {
    score: finalScore,
    matchStatus,
    matchedSkills,
    missingSkills,
    unprovenSkills,
    factorsSupporting,
    factorsLimiting,
    breakdown,
    requirementsEvaluation,
  };
}
