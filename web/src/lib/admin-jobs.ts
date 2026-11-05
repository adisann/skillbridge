import type { AdminJob, ExtractedJob, JobFormValues } from "@/types/admin";

export const DEFAULT_JOB_FORM: JobFormValues = {
  title: "",
  company: "",
  location: "Jakarta, Indonesia (Hybrid)",
  role: "Data Analyst",
  seniority: "Mid",
  experience: "2",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "IDR",
  salaryPeriod: "month",
  education: "Bachelor",
  requiredSkills: "SQL, Python, Excel",
  preferredSkills: "Tableau, Power BI",
  description: "",
  sourceUrl: "",
};

export const ROLE_OPTIONS = [
  { label: "Data Analyst", value: "Data Analyst" },
  { label: "BI Analyst", value: "BI Analyst" },
];

export const SENIORITY_OPTIONS = [
  { label: "Junior", value: "Junior" },
  { label: "Mid", value: "Mid" },
  { label: "Senior", value: "Senior" },
  { label: "Lead", value: "Lead" },
];

export const EDUCATION_OPTIONS = [
  { label: "Sarjana / Bachelor", value: "Bachelor" },
  { label: "Master / S2", value: "Master" },
  { label: "Diploma / D3", value: "Diploma" },
  { label: "Semua Jurusan / Terbuka", value: "All" },
];

export const SKILL_CATEGORY_OPTIONS = [
  "Data & Analytics",
  "Programming & Code",
  "Database & Cloud",
  "Business & Strategy",
].map((category) => ({ label: category, value: category }));

function splitList(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function formFromExtractedJob(job: ExtractedJob): JobFormValues {
  return {
    title: job.title || "",
    company: job.company || "",
    location: job.location || "Indonesia (Hybrid)",
    role: job.canonicalTitle || "Data Analyst",
    seniority: job.seniority || "Junior",
    experience: String(job.experienceYearsMin || 1),
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "IDR",
    salaryPeriod: "month",
    education: job.education || "Bachelor",
    requiredSkills: (job.requiredSkills || []).join(", "),
    preferredSkills: (job.preferredSkills || []).join(", "),
    description: job.description || "",
    sourceUrl: job.sourceUrl || "",
  };
}

export function formFromAdminJob(job: AdminJob): JobFormValues {
  return {
    title: job.title,
    company: job.company,
    location: job.location || "Jakarta, Indonesia (Hybrid)",
    role: job.canonicalTitle || "Data Analyst",
    seniority: job.seniority || "Mid",
    experience: String(job.experienceYearsMin || 2),
    salaryMin: job.salaryMin == null ? "" : String(job.salaryMin),
    salaryMax: job.salaryMax == null ? "" : String(job.salaryMax),
    salaryCurrency: job.salaryCurrency || "IDR",
    salaryPeriod: job.salaryPeriod || "month",
    education: job.education || "Bachelor",
    requiredSkills: (job.requiredSkills || []).join(", "),
    preferredSkills: (job.preferredSkills || []).join(", "),
    description: job.description || "",
    sourceUrl: "",
  };
}

export function buildCreatePayload(form: JobFormValues) {
  return {
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim(),
    canonicalTitle: form.role,
    seniority: form.seniority,
    experienceYearsMin: parseInt(form.experience, 10) || 1,
    salaryMin: form.salaryMin.trim() === "" ? null : Number(form.salaryMin),
    salaryMax: form.salaryMax.trim() === "" ? null : Number(form.salaryMax),
    salaryCurrency: form.salaryCurrency.trim(),
    salaryPeriod: form.salaryPeriod,
    education: form.education,
    requiredSkills: splitList(form.requiredSkills),
    preferredSkills: splitList(form.preferredSkills),
    description: form.description.trim(),
    sourceUrl: form.sourceUrl.trim() || "",
  };
}

export function buildUpdatePayload(id: string, form: JobFormValues) {
  return {
    id,
    title: form.title,
    company: form.company,
    location: form.location,
    canonicalTitle: form.role,
    seniority: form.seniority,
    experienceYearsMin: parseInt(form.experience, 10) || 1,
    salaryMin: form.salaryMin.trim() === "" ? null : Number(form.salaryMin),
    salaryMax: form.salaryMax.trim() === "" ? null : Number(form.salaryMax),
    salaryCurrency: form.salaryCurrency.trim(),
    salaryPeriod: form.salaryPeriod,
    education: form.education,
    requiredSkills: splitList(form.requiredSkills),
    preferredSkills: splitList(form.preferredSkills),
    description: form.description,
  };
}

export function buildDuplicatePayload(job: AdminJob) {
  return {
    title: `${job.title} (Salinan Admin)`,
    company: job.company,
    location: job.location,
    canonicalTitle: job.canonicalTitle,
    employmentType: job.employmentType || "Full-time",
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryCurrency: job.salaryCurrency ?? null,
    salaryPeriod: job.salaryPeriod ?? null,
    seniority: job.seniority || "Mid",
    experienceYearsMin: job.experienceYearsMin ?? 0,
    education: job.education || "Sarjana (S1)",
    requiredSkills: job.requiredSkills || [],
    preferredSkills: job.preferredSkills || [],
    description: job.description || `Deskripsi pekerjaan ${job.title} di ${job.company}.`,
    sourceUrl: job.sourceUrl || "",
  };
}

/** Parser satu baris CSV dengan penanganan tanda kutip ganda (RFC 4180). */
function parseCsvCells(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Format kolom: title,company,location,role,required_skills,description,source_url. Null jika baris tidak valid. */
export function buildPayloadFromCsvRow(row: string) {
  const parts = parseCsvCells(row);
  if (parts.length < 3 || !parts[0]) return null;

  const title = parts[0]?.trim() || "Data Analyst";
  const company = parts[1]?.trim() || "Perusahaan Mitra";
  const location = parts[2]?.trim() || "Indonesia";
  const role = parts[3]?.trim() || "Data Analyst";
  const reqSkills = (parts[4] || "SQL;Excel").split(/[;,]/).map((s) => s.trim()).filter(Boolean);

  return {
    title,
    company,
    location,
    canonicalTitle: role,
    seniority: "Mid",
    experienceYearsMin: 1,
    education: "Sarjana (S1)",
    requiredSkills: reqSkills.length > 0 ? reqSkills : ["SQL", "Excel"],
    preferredSkills: [],
    description: parts[5]?.trim() || `${title} di ${company}. Persyaratan teknis: ${reqSkills.join(", ")}.`,
    sourceUrl: parts[6]?.trim() || "",
  };
}
