import { jobExperienceYears } from "@/lib/job-experience";
import { calculateJobMatch, getDisplayScore } from "@/lib/matching";
import { getCategoryFromTitle } from "@/lib/job-categories";
import { splitJobSkills } from "@/lib/job-skills";
import type { CandidateProfile } from "@/lib/candidate-profile";
import type { RawPublicJob } from "@/lib/public-jobs";

function displayCanonicalTitle(j: RawPublicJob): string {
  return j.canonical_title === "BI Analyst" && /\bbusiness analyst\b/i.test(j.title)
    ? "Business Analyst"
    : j.canonical_title;
}

/**
 * Bentuk satu lowongan untuk daftar (Job Explorer, dashboard, tracker).
 * Deskripsi lengkap sengaja tidak ikut: hanya dipakai halaman detail (/api/jobs/[id]),
 * dan membuat payload daftar jauh lebih kecil.
 * Tanpa `candidate` (tamu / CV belum aktif), field kecocokan diisi nilai kosong.
 */
export function formatJobListItem(j: RawPublicJob, candidate?: CandidateProfile | null) {
  const { required: reqSkills, preferred: prefSkills } = splitJobSkills(j.job_skills);
  const canonicalTitle = displayCanonicalTitle(j);
  const experienceYearsMin = jobExperienceYears(j.experience_years_min, j.description);

  let match = {
    matchScore: null as number | null,
    matchStatus: "insufficient_evidence",
    matchedSkills: [] as string[],
    missingSkills: [] as string[],
    unprovenSkills: [] as string[],
    factorsSupporting: ["Data lowongan resmi aktif."],
    factorsLimiting: ["CV belum terunggah. Unggah CV untuk mengevaluasi kecocokan kualifikasi."],
    scoreBreakdown: [] as unknown[],
    requirementsEvaluation: [] as unknown[],
  };

  if (candidate?.activeResume) {
    const liveMatch = calculateJobMatch(
      {
        skills: candidate.skills,
        experienceYears: candidate.years,
        education: candidate.education,
        gpa: candidate.gpa,
        targetRole: candidate.targetRole,
        claimedSkills: candidate.claimedSkills,
        reviewSkills: candidate.reviewSkills,
        evidence: candidate.evidence,
      },
      {
        title: j.title,
        canonicalTitle,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        experienceYearsMin,
        education: j.education || null,
        minGpa: j.min_gpa ?? null,
        seniority: j.seniority || null,
      }
    );
    match = {
      matchScore: getDisplayScore(liveMatch),
      matchStatus: liveMatch.matchStatus,
      matchedSkills: liveMatch.matchedSkills,
      missingSkills: liveMatch.missingSkills,
      unprovenSkills: liveMatch.unprovenSkills,
      factorsSupporting: liveMatch.factorsSupporting,
      factorsLimiting: liveMatch.factorsLimiting,
      scoreBreakdown: liveMatch.breakdown,
      requirementsEvaluation: liveMatch.requirementsEvaluation,
    };
  }

  const jobCategory = getCategoryFromTitle(j.title, j.canonical_title);

  return {
    id: j.id,
    externalId: j.external_id,
    title: j.title,
    canonicalTitle,
    category: jobCategory.slug,
    categoryLabel: jobCategory.label,
    company: j.company,
    location: j.location,
    employmentType: j.employment_type,
    seniority: j.seniority || "Mid",
    experienceYearsMin,
    education: j.education || "Bachelor",
    salaryMin: j.salary_min ?? null,
    salaryMax: j.salary_max ?? null,
    salaryCurrency: j.salary_currency ?? null,
    salaryPeriod: j.salary_period ?? null,
    minGpa: j.min_gpa ?? null,
    sourceName: j.source_name,
    sourceUrl: j.source_url,
    retrievalMethod: j.retrieval_method,
    retrievedAt: j.retrieved_at,
    expiresAt: j.expires_at || null,
    deadline: j.expires_at || null,
    requiredSkills: reqSkills,
    preferredSkills: prefSkills,
    ...match,
  };
}

export type FormattedJobListItem = ReturnType<typeof formatJobListItem>;

/** Jumlah lowongan aktif per bidang, untuk statistik landing page. */
export function countJobsPerCategory(jobs: RawPublicJob[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const j of jobs) {
    const slug = getCategoryFromTitle(j.title, j.canonical_title).slug || "lainnya";
    counts[slug] = (counts[slug] || 0) + 1;
  }
  return counts;
}
