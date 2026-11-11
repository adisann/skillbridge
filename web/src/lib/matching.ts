import { formatExperience } from "./experience.ts";
import {
  DEFAULT_MATCHING_WEIGHTS,
  DEFAULT_MATCHING_THRESHOLDS,
  RELATED_SKILLS_MAP,
  getCanonicalSkill,
  type MatchingWeights,
  type MatchingThresholds,
} from "./matching-config.ts";
import { compareGpa, gpaScore, formatGpa } from "./gpa.ts";

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

interface ScoreBreakdownItem {
  label: string;
  score: number; // 0 - 100
  weight: number; // Persentase bobot efektif terdistribusi (0 - 100)
  available: boolean;
  notes?: string;
}

interface MatchResult {
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

/**
 * Skor hanya bermakna bila bukti CV cukup. Status `insufficient_evidence`
 * memakai skor patokan internal, jadi tidak boleh sampai ke pengguna.
 */
export function getDisplayScore(result: Pick<MatchResult, "score" | "matchStatus">): number | null {
  return result.matchStatus === "insufficient_evidence" ? null : result.score;
}

interface CandidateProfileInput {
  skills: string[];
  experienceYears: number | null;
  claimedSkills?: string[];
  reviewSkills?: string[];
  evidence?: Record<string, string>;
  education?: string | null;
  gpa?: number | null;
  targetRole?: string | null;
}

interface JobProfileInput {
  title: string;
  canonicalTitle?: string | null;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYearsMin?: number | null;
  education?: string | null;
  minGpa?: number | null;
  seniority?: string | null;
  semanticSimilarity?: number | null;
}

function educationLevel(value?: string | null): number | null {
  const text = (value || "").toLowerCase();
  if (/\bs3\b|doktor|doctor|ph\.?d/.test(text)) return 5;
  if (/\bs2\b|magister|master/.test(text)) return 4;
  if (/\bs1\b|\bd4\b|sarjana|bachelor/.test(text)) return 3;
  if (/\bd3\b|diploma|associate/.test(text)) return 2;
  if (/\bsma\b|\bsmk\b|high school/.test(text)) return 1;
  return null;
}

/** Menghitung kecocokan dari bukti CV; bobot komponen tanpa data dibagi ke komponen yang tersedia. */
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
  let candidateYears: number | null = null;
  let candidateEdu = "";
  let candidateGpa: number | null = null;
  let job: JobProfileInput;

  if (Array.isArray(candidate)) {
    candidateSkills = candidate;
    candidateYears = typeof candidateYearsOrJob === "number" ? candidateYearsOrJob : 0;
    candidateEdu = candidateEducation || "";
    job = (jobInput || {}) as JobProfileInput;
  } else {
    candidateSkills = candidate.skills || [];
    candidateYears = candidate.experienceYears ?? null;
    candidateEdu = candidate.education || "";
    candidateGpa = candidate.gpa ?? null;
    job = candidateYearsOrJob as JobProfileInput;
  }

  const claimed = new Set((!Array.isArray(candidate) ? candidate.claimedSkills || [] : []).map(getCanonicalSkill));
  const review = new Set((!Array.isArray(candidate) ? candidate.reviewSkills || [] : []).map(getCanonicalSkill));
  const provenSkills = candidateSkills.filter((skill) => !claimed.has(getCanonicalSkill(skill)) && !review.has(getCanonicalSkill(skill)));
  const canonicalCandidateSkills = new Set(provenSkills.map(getCanonicalSkill));
  const allCandidateSkills = new Set(candidateSkills.map(getCanonicalSkill));
  const isCandidateEmpty = provenSkills.length === 0 ||
    (provenSkills.length < customThresholds.insufficientEvidenceMinSkills && (candidateYears == null || candidateYears === 0));

  const reqSkills = job.requiredSkills || [];
  const prefSkills = job.preferredSkills || [];
  const isMandatoryAvailable = reqSkills.length > 0;
  const isPreferredAvailable = prefSkills.length > 0;

  function evaluateRequirement(skillName: string, index: number, isMandatory: boolean): RequirementEvaluation {
    const skill = skillName.trim();
    const key = getCanonicalSkill(skill);
    let status: RequirementStatus = "belum_ditemukan";
    let statusLabel: RequirementEvaluation["statusLabel"] = "Belum ditemukan di CV";
    let evidence = "";
    if (allCandidateSkills.has(key) && (claimed.has(key) || review.has(key))) {
      status = "belum_cukup_bukti";
      statusLabel = "Belum cukup bukti";
      evidence = claimed.has(key)
        ? "Ditambahkan oleh pengguna (pengakuan mandiri); bukan bukti tercantum di CV atau verifikasi independen."
        : "Perlu verifikasi: hasil ekstraksi belum ditinjau. Tinjau cuplikan pada koreksi CV.";
    } else if (canonicalCandidateSkills.has(key)) {
      status = "cocok";
      statusLabel = "Cocok di CV";
      const entry = !Array.isArray(candidate) && Object.entries(candidate.evidence || {}).find(([name]) => getCanonicalSkill(name) === key);
      if (entry && entry[1].trim()) evidence = `Cuplikan CV: ${entry[1]}`;
    } else {
      const related = RELATED_SKILLS_MAP[key] || [];
      const found = related.find((name) => canonicalCandidateSkills.has(getCanonicalSkill(name)));
      if (found) {
        status = "belum_cukup_bukti";
        statusLabel = "Belum cukup bukti";
        evidence = `CV-mu memuat kompetensi serumpun (${found}), namun belum ada rincian bukti penggunaan alat ini secara spesifik.`;
      }
    }
    return { id: `req-${isMandatory ? "m" : "p"}-${index}`, skill, isMandatory, status, statusLabel, evidence };
  }

  const mandatory = reqSkills.map((skill, index) => evaluateRequirement(skill, index, true));
  const preferred = prefSkills.map((skill, index) => evaluateRequirement(skill, index, false));
  const requirementsEvaluation = [...mandatory, ...preferred];
  const matchedSkills = [...new Set(requirementsEvaluation.filter((r) => r.status === "cocok").map((r) => r.skill))];
  const missingSkills = mandatory.filter((r) => r.status === "belum_ditemukan").map((r) => r.skill);
  const unprovenSkills = [...new Set(requirementsEvaluation.filter((r) => r.status === "belum_cukup_bukti").map((r) => r.skill))];
  const matchedMandatoryCount = mandatory.filter((r) => r.status === "cocok").length;
  const mandatoryRatio = isMandatoryAvailable ? matchedMandatoryCount / mandatory.length : 1;
  const skillScore = (items: RequirementEvaluation[]) => items.length
    ? items.reduce((sum, r) => sum + (r.status === "cocok" ? 1 : r.status === "belum_cukup_bukti" ? 0.5 : 0), 0) / items.length
    : 1;
  const mandatoryScore = skillScore(mandatory);
  const preferredScore = skillScore(preferred);

  // ---------------------------------------------------------------------------
  // 3. Evaluasi Pengalaman Kerja (Experience)
  // ---------------------------------------------------------------------------
  const minYears = job.experienceYearsMin || 0;
  const isExpAvailable = minYears > 0 && candidateYears != null;
  let expScore = 1.0;

  if (isExpAvailable && candidateYears != null) {
    if (candidateYears >= minYears) {
      expScore = 1.0;
    } else {
      expScore = Math.max(0.15, candidateYears / minYears);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Evaluasi Pendidikan & Senioritas
  // ---------------------------------------------------------------------------
  const gpaFit = compareGpa(candidateGpa, job.minGpa);
  const candidateLevel = educationLevel(candidateEdu);
  const requiredLevel = educationLevel(job.education);
  const hasEducation = candidateLevel != null && requiredLevel != null;
  const educationBelow = hasEducation && candidateLevel < requiredLevel;
  const level = (job.seniority || "").toLowerCase();
  const seniorityMinYears = /senior|lead/.test(level) ? customThresholds.seniorMinExperienceYears : /mid/.test(level) ? customThresholds.midMinExperienceYears : /junior|entry|intern|magang/.test(level) ? 0 : null;
  const hasSeniority = seniorityMinYears != null && candidateYears != null;
  const seniorityBelow = seniorityMinYears != null && candidateYears != null && candidateYears < seniorityMinYears;
  const educationScores: number[] = [];
  if (hasEducation) educationScores.push(educationBelow ? 0.65 : 1);
  if (hasSeniority) educationScores.push(seniorityBelow && candidateYears != null && seniorityMinYears != null ? Math.max(0.4, candidateYears / seniorityMinYears) : 1);
  if (gpaFit !== "unknown") educationScores.push(gpaScore(candidateGpa as number, job.minGpa as number));
  const isEduAvailable = educationScores.length > 0;
  const eduScore = isEduAvailable ? educationScores.reduce((sum, score) => sum + score, 0) / educationScores.length : 1;

  // Nilai semantik hanya dipakai bila tersedia; jangan menggantinya dengan tebakan berdasarkan skill data.
  const semanticScore = job.semanticSimilarity ?? 0;
  const isSemanticAvailable = job.semanticSimilarity != null && Number.isFinite(semanticScore) && semanticScore >= 0 && semanticScore <= 1;

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
      notes: isMandatoryAvailable ? `${matchedMandatoryCount}/${reqSkills.length} terpenuhi` : "Tidak disyaratkan secara spesifik",
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
      notes: isExpAvailable ? `Syarat: ${formatExperience(minYears)}, CV: ${formatExperience(candidateYears)}` : minYears > 0 ? "Pengalaman relevan belum diisi untuk target aktif" : "Tidak mensyaratkan durasi minimum",
    },
    {
      key: "educationSeniority",
      label: "Pendidikan & Level",
      score: eduScore,
      baseWeight: customWeights.educationSeniority,
      available: isEduAvailable,
      notes: isEduAvailable
        ? `${job.education || "Pendidikan umum"} • ${job.seniority || "Semua level"}${job.minGpa != null ? ` • IPK min ${formatGpa(job.minGpa)}` : ""}`
        : "Bukti pendidikan, level, atau IPK belum tersedia untuk dibandingkan",
    },
    {
      key: "semantic",
      label: "Kesesuaian Semantik",
      score: semanticScore,
      baseWeight: customWeights.semantic,
      available: isSemanticAvailable,
      notes: isSemanticAvailable ? "Kemiripan semantik CV dan lowongan" : "Nilai semantik belum tersedia; bobot dibagi ke komponen yang tersedia",
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
        score: 0,
        weight: 0,
        available: false,
        notes: comp.notes || "Tidak disyaratkan di lowongan",
      });
    }
  }

  const isJobWithoutTechnicalCriteria = !isMandatoryAvailable && !isPreferredAvailable && !isExpAvailable;

  const finalScore = isCandidateEmpty
    ? 15
    : isJobWithoutTechnicalCriteria
    ? Math.min(50, Math.round(semanticScore * 50))
    : Math.min(100, Math.max(5, Math.round(rawWeightedScore * 100)));

  // ---------------------------------------------------------------------------
  // 7. Penentuan Kategori Status & Faktor Pendukung / Pembatas
  // ---------------------------------------------------------------------------
  let matchStatus: MatchCategory = "match";
  const factorsSupporting: string[] = [];
  const factorsLimiting: string[] = [];

  // Faktor Pendukung
  if (matchedSkills.length > 0) {
    factorsSupporting.push(
      `Memenuhi ${matchedSkills.length} kualifikasi skill yang tercantum di lowongan (${matchedSkills.slice(0, 3).join(", ")})`
    );
  }
  if (isExpAvailable && candidateYears != null && candidateYears >= minYears) {
    factorsSupporting.push(
      `Pengalaman kerja (${formatExperience(candidateYears)}) memenuhi kualifikasi minimum yang disyaratkan (${formatExperience(minYears)})`
    );
  }
  if (gpaFit === "meets") {
    factorsSupporting.push(
      `IPK ${formatGpa(candidateGpa as number)} memenuhi syarat minimum IPK ${formatGpa(job.minGpa as number)}`
    );
  }
  if (isSemanticAvailable && semanticScore >= 0.8) {
    factorsSupporting.push(
      `Kemiripan makna CV dan deskripsi lowongan mendukung kecocokan`
    );
  }

  // Faktor Pembatas (Skill Gap, Pengalaman & IPK)
  if (gpaFit === "below") {
    factorsLimiting.push(
      `IPK ${formatGpa(candidateGpa as number)} di bawah syarat minimum IPK ${formatGpa(job.minGpa as number)}`
    );
  }
  if (missingSkills.length > 0) {
    factorsLimiting.push(
      `Skill wajib ${missingSkills.slice(0, 4).join(", ")} belum ditemukan di CV`
    );
  }
  if (unprovenSkills.length > 0) {
    factorsLimiting.push(
      `Skill ${unprovenSkills.slice(0, 3).join(", ")} belum memuat bukti spesifik (hasil ekstraksi belum ditinjau, klaim mandiri, atau kompetensi serumpun)`
    );
  }
  const missingPreferred = preferred.filter((requirement) => requirement.status === "belum_ditemukan").map((requirement) => requirement.skill);
  if (missingPreferred.length > 0) {
    factorsLimiting.push(`Skill tambahan ${missingPreferred.slice(0, 3).join(", ")} belum ditemukan di CV`);
  }
  if (isExpAvailable && candidateYears != null && candidateYears < minYears) {
    factorsLimiting.push(
      `Pengalaman kerja (${formatExperience(candidateYears)}) belum mencapai kualifikasi minimum lowongan (${formatExperience(minYears)})`
    );
  }

  if (educationBelow) factorsLimiting.push("Jenjang pendidikan di CV belum mencapai syarat minimum lowongan.");
  if (seniorityBelow) factorsLimiting.push("Pengalaman di CV belum mendukung level senioritas lowongan.");
  const meetsQualifications = finalScore >= customThresholds.matchScoreMin &&
    (!isMandatoryAvailable || mandatoryRatio >= customThresholds.mandatoryRatioMin) &&
    (!isExpAvailable || (candidateYears != null && candidateYears >= minYears)) &&
    !educationBelow && !seniorityBelow && gpaFit !== "below";

  // Klasifikasi Kategori
  if (isCandidateEmpty || isJobWithoutTechnicalCriteria) {
    matchStatus = "insufficient_evidence";
    if (isJobWithoutTechnicalCriteria) {
      factorsLimiting.unshift(
        "Lowongan ini belum memuat rincian kualifikasi skill atau pengalaman minimum spesifik di sistem"
      );
    } else {
      factorsLimiting.unshift(
        "CV belum memuat informasi kualifikasi atau keterampilan teknis yang cukup untuk dievaluasi"
      );
    }
  } else if (
    meetsQualifications && isExpAvailable && /junior|entry|intern|magang/.test(level) &&
    candidateYears != null && candidateYears >= minYears + customThresholds.overqualifiedMinExperienceDiff
  ) {
    matchStatus = "potentially_overqualified";
    factorsSupporting.push(
      `Pengalaman kerja (${formatExperience(candidateYears)}) melampaui level kualifikasi peran ini (${formatExperience(minYears)}) — indikasi overkualifikasi tentatif`
    );
  } else if (
    meetsQualifications
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
