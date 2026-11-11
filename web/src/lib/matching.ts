import { formatExperience } from "./experience.ts";
import {
  DEFAULT_MATCHING_WEIGHTS,
  DEFAULT_MATCHING_THRESHOLDS,
  getCanonicalSkill,
  type MatchingWeights,
  type MatchingThresholds,
} from "./matching-config.ts";
import { compareGpa, gpaScore, formatGpa, parseGpaValue } from "./gpa.ts";
import { hasPlaceholderRequirements, isIndependentlyRequired, requirementGroups, toolExampleGroups, uniqueSkills, type ToolExampleGroup } from "./matching-requirements.ts";
import { languageFamily, languageQualification } from "./language-skills.ts";

export type MatchCategory =
  | "match"
  | "underqualified"
  | "potentially_overqualified"
  | "insufficient_evidence";

export type RequirementStatus = "cocok" | "belum_ditemukan" | "belum_cukup_bukti";
export type MatchStatusReason = "job_data_incomplete" | "cv_data_incomplete";

export interface RequirementEvaluation {
  id: string;
  skill: string;
  isMandatory: boolean;
  status: RequirementStatus;
  statusLabel: "Cocok di CV" | "Belum ditemukan di CV" | "Belum cukup bukti" | "Di bawah minimum";
  evidence: string;
  alternatives?: string[];
  matchedAlternative?: string;
  exampleGroupLabel?: string;
  minimumNotMet?: boolean;
  currentLevelLabel?: string;
  requiredLevelLabel?: string;
  /** Skill dipenuhi oleh skill yang ditambahkan pengguna di CV Saya, bukan hasil baca teks CV. */
  addedByUser?: boolean;
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
  matchStatusReason: MatchStatusReason | null;
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
 * belum memiliki bukti wajib yang lengkap, jadi skor parsialnya tidak ditampilkan.
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
  description?: string | null;
  requirementsNeedReview?: boolean;
  canonicalTitle?: string | null;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYearsMin?: number | null;
  education?: string | null;
  minGpa?: number | null;
  seniority?: string | null;
  semanticSimilarity?: number | null;
}

function educationLevel(value?: string | null, minimum = false): number | null {
  const text = (value || "").toLowerCase();
  const levels = [
    /\bsma\b|\bsmk\b|high school/.test(text) ? 1 : null,
    /\bd3\b|diploma|associate/.test(text) ? 2 : null,
    /\bs1\b|\bd4\b|sarjana|bachelor/.test(text) ? 3 : null,
    /\bs2\b|magister|master/.test(text) ? 4 : null,
    /\bs3\b|doktor|doctor|ph\.?d/.test(text) ? 5 : null,
  ].filter((level): level is number => level != null);
  return levels.length ? (minimum ? Math.min(...levels) : Math.max(...levels)) : null;
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
  candidateSkills = uniqueSkills(candidateSkills);
  candidateYears = candidateYears != null && Number.isFinite(candidateYears) && candidateYears >= 0 ? candidateYears : null;
  // Skill tambahan pengguna adalah bagian CV tersimpan; hanya hasil baca yang belum ditinjau yang belum dihitung.
  const provenSkills = candidateSkills.filter((skill) => !review.has(getCanonicalSkill(skill)));
  const canonicalCandidateSkills = new Set(provenSkills.map(getCanonicalSkill));
  const allCandidateSkills = new Set(candidateSkills.map(getCanonicalSkill));
  const evidenceBySkill = new Map(Object.entries(Array.isArray(candidate) ? {} : candidate.evidence || {})
    .filter(([, text]) => text.trim()).map(([name, text]) => [getCanonicalSkill(name), text] as const));
  const cvSnippet = (skillName: string) => evidenceBySkill.get(getCanonicalSkill(skillName));
  const isCandidateEmpty = provenSkills.length === 0 ||
    (provenSkills.length < customThresholds.insufficientEvidenceMinSkills && (candidateYears == null || candidateYears === 0));

  const reqSkills = uniqueSkills(job.requiredSkills || []);
  const requiredKeys = new Set(reqSkills.map(getCanonicalSkill));
  const prefSkills = uniqueSkills(job.preferredSkills || []).filter((s) => !requiredKeys.has(getCanonicalSkill(s)));
  const isMandatoryAvailable = reqSkills.length > 0;
  const isPreferredAvailable = prefSkills.length > 0;

  function evaluateRequirement(skillName: string, index: number, isMandatory: boolean): RequirementEvaluation {
    const skill = skillName.trim();
    const key = getCanonicalSkill(skill);
    let status: RequirementStatus = "belum_ditemukan";
    let statusLabel: RequirementEvaluation["statusLabel"] = "Belum ditemukan di CV";
    let evidence = "";
    const requiredGrade = languageQualification(skill);
    const family = languageFamily(skill);
    if (family) {
      const languageName = family === "mandarin" ? "Mandarin" : "Bahasa Jepang";
      const languages = candidateSkills.filter((s) => languageFamily(s) === family);
      const provenLanguages = provenSkills.filter((s) => languages.includes(s));
      const meetsGrade = (s: string) => !requiredGrade || (languageQualification(s)?.scheme === requiredGrade.scheme && languageQualification(s)!.rank >= requiredGrade.rank);
      const sufficient = provenLanguages.find(meetsGrade);
      const pending = languages.find((s) => !provenLanguages.includes(s) && meetsGrade(s));
      const grades = provenLanguages.flatMap((s) => languageQualification(s) ? [languageQualification(s)!] : [])
        .filter((grade) => !requiredGrade || grade.scheme === requiredGrade.scheme).sort((a, b) => b.rank - a.rank);
      let minimumNotMet = false;
      if (sufficient) {
        status = "cocok";
        statusLabel = "Cocok di CV";
        const addedByUser = claimed.has(getCanonicalSkill(sufficient));
        const snippet = addedByUser ? "" : cvSnippet(sufficient);
        evidence = `${sufficient} ${addedByUser ? "ditambahkan oleh pengguna" : "tercantum di CV"}${requiredGrade ? ` dan memenuhi minimum ${requiredGrade.label}` : ""}.${snippet ? ` Cuplikan CV: ${snippet}` : ""} Level bahasa tidak diverifikasi dengan sertifikat.`;
        return { id: `req-${isMandatory ? "m" : "p"}-${index}`, skill, isMandatory, status, statusLabel, evidence, addedByUser, requiredLevelLabel: requiredGrade?.label };
      } else if (grades.length === 0 && (pending || languages.length > 0)) {
        status = "belum_cukup_bukti";
        statusLabel = "Belum cukup bukti";
        evidence = pending ? "Hasil baca level bahasa belum ditinjau; belum dihitung sebagai bukti cocok." : `${languageName} tercantum di CV, tetapi level ${requiredGrade?.scheme || "kemampuan"} belum ditemukan. Lowongan mensyaratkan minimal ${requiredGrade?.label || skill}.`;
      } else {
        minimumNotMet = grades.length > 0 && requiredGrade != null;
        if (minimumNotMet) statusLabel = "Di bawah minimum";
        evidence = minimumNotMet ? `CV mencantumkan ${grades[0].label}; minimum ${requiredGrade!.label} belum terpenuhi.` : `${requiredGrade ? `${languageName} dengan minimal ${requiredGrade.label}` : languageName} belum ditemukan di CV.`;
      }
      return { id: `req-${isMandatory ? "m" : "p"}-${index}`, skill, isMandatory, status, statusLabel, evidence, minimumNotMet, currentLevelLabel: grades[0]?.label, requiredLevelLabel: requiredGrade?.label };
    }
    if (review.has(key) && allCandidateSkills.has(key)) {
      status = "belum_cukup_bukti";
      statusLabel = "Belum cukup bukti";
      evidence = "Perlu verifikasi: hasil ekstraksi belum ditinjau. Tinjau cuplikan pada koreksi CV.";
    } else if (canonicalCandidateSkills.has(key)) {
      status = "cocok";
      statusLabel = "Cocok di CV";
      if (claimed.has(key)) {
        evidence = `${skill} ditambahkan oleh pengguna di CV Saya.`;
        return { id: `req-${isMandatory ? "m" : "p"}-${index}`, skill, isMandatory, status, statusLabel, evidence, addedByUser: true };
      }
      const snippet = cvSnippet(skill);
      evidence = snippet ? `Cuplikan CV: ${snippet}` : `${skill} tercantum pada daftar skill CV yang telah ditinjau.`;
    }
    return { id: `req-${isMandatory ? "m" : "p"}-${index}`, skill, isMandatory, status, statusLabel, evidence };
  }

  function evaluateGroup(skills: string[], index: number, isMandatory: boolean, example?: ToolExampleGroup): RequirementEvaluation {
    const evaluations = skills.map((s) => evaluateRequirement(s, index, isMandatory));
    const best = evaluations.find((r) => r.status === "cocok") || evaluations.find((r) => r.status === "belum_cukup_bukti") || evaluations[0];
    if (example) return {
      ...best,
      id: `req-${isMandatory ? "m" : "p"}-${index}`,
      skill: `${example.label}: ${skills.join(" / ")}`,
      alternatives: skills,
      matchedAlternative: best.status === "cocok" ? best.skill : undefined,
      exampleGroupLabel: example.label,
      status: best.status === "belum_ditemukan" ? "belum_cukup_bukti" : best.status,
      statusLabel: best.status === "belum_ditemukan" ? "Belum cukup bukti" : best.statusLabel,
      evidence: `Sumber: ${example.sourceSnippet}. Ini daftar contoh alat, bukan kewajiban menguasai semuanya.${best.status === "cocok" ? ` ${best.skill} tercantum di CV dan mendukung syarat penggunaan alat ini.` : " Belum ada contoh alat yang cukup terbukti di CV; alat lain mungkin relevan dan perlu ditinjau."} ${best.evidence}`,
    };
    return skills.length === 1 ? best : {
      ...best,
      skill: skills.join(" / "),
      alternatives: skills,
      matchedAlternative: best.status === "cocok" ? best.skill : undefined,
      evidence: `Syarat ${skills.join(" atau ")}: cukup salah satu.${best.status === "cocok" ? ` Terpenuhi melalui ${best.skill}.` : ""} ${best.evidence || "Belum ada alternatif yang ditemukan di CV."}`,
    };
  }
  const description = job.description || "";
  const examples = toolExampleGroups([...reqSkills, ...prefSkills], description);
  const requiredExamples = examples.filter((group) => group.skills.some((s) => requiredKeys.has(getCanonicalSkill(s))));
  const preferredExamples = examples.filter((group) => !requiredExamples.includes(group));
  const consumedRequired = new Set(requiredExamples.flatMap((group) => group.skills.map(getCanonicalSkill)));
  const consumedPreferred = new Set(preferredExamples.flatMap((group) => group.skills.map(getCanonicalSkill)));
  const mandatory = [
    ...requiredExamples.map((group, index) => evaluateGroup(group.skills, index, true, group)),
    ...requirementGroups(reqSkills.filter((s) => !consumedRequired.has(getCanonicalSkill(s)) || isIndependentlyRequired(s, description)), description)
      .map((group, index) => evaluateGroup(group, index + requiredExamples.length, true)),
  ];
  const preferred = [
    ...preferredExamples.map((group, index) => evaluateGroup(group.skills, index, false, group)),
    ...requirementGroups(prefSkills.filter((s) => !consumedPreferred.has(getCanonicalSkill(s))), description)
      .map((group, index) => evaluateGroup(group, index + preferredExamples.length, false)),
  ];
  const requirementsEvaluation = [...mandatory, ...preferred];
  const matchedSkills = [...new Set(requirementsEvaluation.filter((r) => r.status === "cocok").map((r) => r.skill))];
  const missingSkills = mandatory.filter((r) => r.status === "belum_ditemukan").map((r) => r.skill);
  const unprovenSkills = [...new Set(requirementsEvaluation.filter((r) => r.status === "belum_cukup_bukti").map((r) => r.skill))];
  const matchedMandatoryCount = mandatory.filter((r) => r.status === "cocok").length;
  const mandatoryRatio = isMandatoryAvailable ? matchedMandatoryCount / mandatory.length : 1;
  const skillScore = (items: RequirementEvaluation[]) => items.length
    ? items.filter((r) => r.status === "cocok").length / items.length
    : 1;
  const mandatoryScore = skillScore(mandatory);
  const preferredScore = skillScore(preferred);

  // ---------------------------------------------------------------------------
  // 3. Evaluasi Pengalaman Kerja (Experience)
  // ---------------------------------------------------------------------------
  const minYears = job.experienceYearsMin != null && Number.isFinite(job.experienceYearsMin) && job.experienceYearsMin >= 0 ? job.experienceYearsMin : null;
  const isExpAvailable = minYears != null && candidateYears != null;
  let expScore = 1.0;

  if (isExpAvailable && candidateYears != null && minYears != null) {
    if (candidateYears >= minYears) {
      expScore = 1.0;
    } else {
      expScore = candidateYears / minYears;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Evaluasi Pendidikan & Senioritas
  // ---------------------------------------------------------------------------
  candidateGpa = parseGpaValue(candidateGpa);
  const minGpa = parseGpaValue(job.minGpa);
  const gpaFit = compareGpa(candidateGpa, minGpa);
  const candidateLevel = educationLevel(candidateEdu);
  const requiredLevel = educationLevel(job.education, true);
  const hasEducation = candidateLevel != null && requiredLevel != null;
  const educationBelow = hasEducation && candidateLevel < requiredLevel;
  const level = (job.seniority || "").toLowerCase();
  // Label Mid/Senior tidak menetapkan minimum tahun; gunakan syarat eksplisit lowongan.
  const educationScores: number[] = [];
  if (hasEducation) educationScores.push(educationBelow ? 0 : 1);
  if (gpaFit !== "unknown") educationScores.push(gpaScore(candidateGpa as number, minGpa as number));
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
      notes: isMandatoryAvailable ? `${matchedMandatoryCount}/${mandatory.length} terpenuhi` : "Skill wajib belum dirinci dalam data lowongan",
    },
    {
      key: "preferredSkills",
      label: "Skill Tambahan",
      score: preferredScore,
      baseWeight: customWeights.preferredSkills,
      available: isPreferredAvailable,
      notes: isPreferredAvailable ? `${preferred.filter((r) => r.status === "cocok").length}/${preferred.length} skill tambahan terpenuhi` : "Skill tambahan belum dirinci dalam data lowongan",
    },
    {
      key: "experience",
      label: "Pengalaman Kerja",
      score: Math.min(expScore, 1.0),
      baseWeight: customWeights.experience,
      available: isExpAvailable,
      notes: isExpAvailable ? `Syarat: ${formatExperience(minYears)}, CV: ${formatExperience(candidateYears)}` : minYears != null ? "Pengalaman relevan belum diisi untuk target aktif" : "Syarat durasi minimum belum tersedia di data lowongan",
    },
    {
      key: "educationGpa",
      label: "Pendidikan & IPK",
      score: eduScore,
      baseWeight: customWeights.educationGpa,
      available: isEduAvailable,
      notes: isEduAvailable
        ? [job.education, minGpa != null ? `IPK min ${formatGpa(minGpa)}` : null].filter(Boolean).join(" • ")
        : "Bukti pendidikan atau IPK belum tersedia untuk dibandingkan",
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

  // Pembulatan metode sisa terbesar: bobot yang ditampilkan tepat berjumlah 100%.
  const weights = activeComponents.map((c) => c.available && totalActiveWeight > 0 ? c.baseWeight / totalActiveWeight * 100 : 0);
  const displayWeights = weights.map(Math.floor);
  const remainders = weights.map((w, index) => ({ index, remainder: w - displayWeights[index] }))
    .filter(({ index }) => activeComponents[index].available)
    .sort((a, b) => b.remainder - a.remainder);
  const remainingWeight = totalActiveWeight > 0 ? 100 - displayWeights.reduce((a, b) => a + b, 0) : 0;
  for (const { index } of remainders.slice(0, remainingWeight)) displayWeights[index]++;

  let rawWeightedScore = 0;
  const breakdown: ScoreBreakdownItem[] = [];

  for (const [index, comp] of activeComponents.entries()) {
    if (comp.available && totalActiveWeight > 0) {
      // Bobot dinormalisasi ulang agar totalnya 1.0 (100%)
      const effectiveWeightRatio = comp.baseWeight / totalActiveWeight;
      const effectiveWeightPercent = displayWeights[index];
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

  const isJobWithoutTechnicalCriteria = !isMandatoryAvailable && minYears == null;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawWeightedScore * 100)));

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
  if (isExpAvailable && candidateYears != null && minYears != null && candidateYears >= minYears) {
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
  const absentMandatory = mandatory.filter((r) => r.status === "belum_ditemukan" && !r.minimumNotMet).map((r) => r.skill);
  factorsLimiting.push(...mandatory.filter((r) => r.minimumNotMet).map((r) => r.evidence));
  if (absentMandatory.length > 0) {
    factorsLimiting.push(
      `Skill wajib ${absentMandatory.slice(0, 4).join(", ")} belum ditemukan di CV`
    );
  }
  const missingPreferred = preferred.filter((requirement) => requirement.status === "belum_ditemukan" && !requirement.minimumNotMet).map((requirement) => requirement.skill);
  if (isExpAvailable && candidateYears != null && minYears != null && candidateYears < minYears) {
    factorsLimiting.push(
      `Pengalaman kerja (${formatExperience(candidateYears)}) belum mencapai kualifikasi minimum lowongan (${formatExperience(minYears)})`
    );
  }

  if (educationBelow) factorsLimiting.push("Jenjang pendidikan di CV belum mencapai syarat minimum lowongan.");
  const unknownRequirements: string[] = [];
  if (job.requirementsNeedReview || hasPlaceholderRequirements(job.description)) unknownRequirements.push("Deskripsi persyaratan lowongan belum lengkap di sistem. Perlu meninjau sumber asli sebelum menyimpulkan kualifikasi.");
  if (minYears != null && minYears > 0 && candidateYears == null) unknownRequirements.push("Pengalaman relevan di CV belum tersedia untuk dibandingkan dengan syarat lowongan.");
  if (job.education?.trim() && (!hasEducation)) unknownRequirements.push("Bukti jenjang pendidikan belum cukup untuk dibandingkan dengan syarat lowongan.");
  if (job.minGpa != null && gpaFit === "unknown") unknownRequirements.push("IPK di CV belum tersedia untuk dibandingkan dengan syarat lowongan.");
  const unprovenMandatory = mandatory.filter((r) => r.status === "belum_cukup_bukti").map((r) => r.skill);
  if (unprovenMandatory.length) unknownRequirements.push(`Skill wajib ${unprovenMandatory.slice(0, 3).join(", ")} belum memuat bukti spesifik (hasil baca CV belum ditinjau, level bahasa belum tercantum, atau alat yang dicontohkan lowongan belum ada di CV)`);
  factorsLimiting.push(...unknownRequirements);
  // Ringkasan kartu mengambil alasan pertama: dahulukan gap wajib, baru skill tambahan.
  if (missingPreferred.length) factorsLimiting.push(`Skill tambahan ${missingPreferred.slice(0, 3).join(", ")} belum ditemukan di CV`);
  factorsLimiting.push(...preferred.filter((r) => r.minimumNotMet).map((r) => `Syarat tambahan: ${r.evidence}`));
  const unprovenPreferred = preferred.filter((r) => r.status === "belum_cukup_bukti").map((r) => r.skill);
  if (unprovenPreferred.length) factorsLimiting.push(`Skill tambahan ${unprovenPreferred.slice(0, 3).join(", ")} belum memuat bukti spesifik di CV`);
  const hasKnownGap = missingSkills.length > 0 ||
    (isExpAvailable && candidateYears != null && minYears != null && candidateYears < minYears) || educationBelow || gpaFit === "below";
  const hasUnresolvedRequirements = unknownRequirements.length > 0;
  // Skor adalah agregat untuk peringkat. Skill tambahan/semantik tidak menghapus gap wajib,
  // dan kekurangan skill tambahan saja tidak menggagalkan syarat wajib yang sudah cocok.
  const meetsQualifications = !hasKnownGap && !hasUnresolvedRequirements &&
    (!isMandatoryAvailable || mandatoryRatio >= customThresholds.mandatoryRatioMin) &&
    (!isExpAvailable || (candidateYears != null && minYears != null && candidateYears >= minYears));

  // Klasifikasi Kategori
  if (isCandidateEmpty || isJobWithoutTechnicalCriteria) {
    matchStatus = "insufficient_evidence";
    if (isJobWithoutTechnicalCriteria) {
      factorsLimiting.unshift(
        "Lowongan ini belum memuat rincian skill wajib atau pengalaman minimum spesifik di sistem"
      );
    } else {
      factorsLimiting.unshift(
        "CV belum memuat informasi kualifikasi atau keterampilan teknis yang cukup untuk dievaluasi"
      );
    }
  } else if (!hasKnownGap && hasUnresolvedRequirements) {
    matchStatus = "insufficient_evidence";
  } else if (
    meetsQualifications && isExpAvailable && /junior|entry|intern|magang/.test(level) &&
    candidateYears != null && minYears != null && candidateYears >= minYears + customThresholds.overqualifiedMinExperienceDiff
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
    factorsLimiting.push("Tidak ditemukan gap pada persyaratan yang dapat dinilai dari data tersedia.");
  }

  return {
    score: finalScore,
    matchStatus,
    matchStatusReason: matchStatus === "insufficient_evidence"
      ? !isCandidateEmpty && (isJobWithoutTechnicalCriteria || job.requirementsNeedReview || hasPlaceholderRequirements(job.description)) ? "job_data_incomplete" : "cv_data_incomplete"
      : null,
    matchedSkills,
    missingSkills,
    unprovenSkills,
    factorsSupporting,
    factorsLimiting,
    breakdown,
    requirementsEvaluation,
  };
}
