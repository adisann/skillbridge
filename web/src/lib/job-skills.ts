import { jobExperienceYears } from "./job-experience.ts";

interface JobSkillRow {
  is_mandatory: boolean;
  skills: { name: string } | null;
}

/** Pisahkan skill lowongan menjadi wajib (is_mandatory) dan tambahan. */
export function splitJobSkills(jobSkills: JobSkillRow[] | null | undefined): {
  required: string[];
  preferred: string[];
} {
  const required: string[] = [];
  const preferred: string[] = [];
  for (const js of jobSkills ?? []) {
    if (!js.skills?.name) continue;
    (js.is_mandatory ? required : preferred).push(js.skills.name);
  }
  return { required, preferred };
}

interface JobRowForMatching {
  title: string;
  description?: string | null;
  canonical_title?: string | null;
  experience_years_min?: number | null;
  education?: string | null;
  min_gpa?: number | null;
  seniority?: string | null;
  job_skills?: JobSkillRow[] | null;
}

/** Bentuk input lowongan untuk calculateJobMatch dari baris tabel jobs beserta job_skills. */
export function toMatchJob(job: JobRowForMatching) {
  const { required, preferred } = splitJobSkills(job.job_skills);
  return {
    title: job.title,
    description: job.description,
    canonicalTitle: job.canonical_title,
    requiredSkills: required,
    preferredSkills: preferred,
    experienceYearsMin: jobExperienceYears(job.experience_years_min, job.description),
    education: job.education || null,
    minGpa: job.min_gpa ?? null,
    seniority: job.seniority || null,
  };
}
