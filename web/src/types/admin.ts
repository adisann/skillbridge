export interface AdminJob {
  id: string;
  title: string;
  canonicalTitle: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  experienceYearsMin?: number;
  education?: string;
  description?: string;
  sourceName: string;
  sourceUrl?: string;
  retrievalMethod: string;
  requiredSkills: string[];
  preferredSkills?: string[];
}

export interface WorkerRunRecord {
  id: string;
  source_name: string;
  retrieval_method: string;
  status: string;
  created_at: string;
  fetched_count: number;
  inserted_count: number;
  updated_count: number;
  duplicate_count: number;
  failed_count: number;
  error_message: string | null;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  skill_aliases: Array<{ id: string; alias: string }>;
}

export interface JobSourceItem {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
}

export type AdminTab = "jobs" | "skills" | "runs";

export interface AdminNotification {
  type: "success" | "error" | "info";
  message: string;
}

/** Nilai form lowongan (semua string karena berasal dari input). */
export interface JobFormValues {
  title: string;
  company: string;
  location: string;
  role: string;
  seniority: string;
  experience: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  education: string;
  requiredSkills: string;
  preferredSkills: string;
  description: string;
  sourceUrl: string;
}

/** Lowongan hasil ekstraksi URL/OCR yang dipakai untuk mengisi form tambah. */
export interface ExtractedJob {
  title?: string;
  company?: string;
  location?: string;
  canonicalTitle?: string;
  seniority?: string;
  experienceYearsMin?: number | string;
  education?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  description?: string;
  sourceUrl?: string;
}
