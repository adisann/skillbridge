import type { MatchCategory, RequirementEvaluation } from "@/lib/matching";

/** Lowongan pada daftar Job Explorer (respons GET /api/jobs). */
export interface JobListItem {
  id: string;
  externalId: string;
  title: string;
  canonicalTitle: string;
  category?: string;
  categoryLabel?: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: string;
  /** Minimal tahun pengalaman; null jika lowongan tidak menyebutkan. */
  experienceYearsMin?: number | null;
  sourceName: string;
  sourceUrl: string;
  retrievalMethod: string;
  retrievedAt: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchScore: number | null;
  matchStatus: MatchCategory;
  matchedSkills: string[];
  missingSkills: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
}

export interface ScoreBreakdownEntry {
  label: string;
  score: number;
  weight: number;
  available?: boolean;
  notes?: string;
}

/** Rincian lowongan (respons GET /api/jobs/[id]). */
export interface JobDetailData {
  id: string;
  title: string;
  canonicalTitle: string;
  category?: string;
  categoryLabel?: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: string;
  sourceName: string;
  sourceUrl: string;
  retrievalMethod: string;
  retrievedAt?: string;
  expiresAt?: string;
  deadline?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchScore: number | null;
  matchStatus: MatchCategory;
  matchedSkills: string[];
  missingSkills: string[];
  unprovenSkills?: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
  scoreBreakdown: ScoreBreakdownEntry[];
  requirementsEvaluation?: RequirementEvaluation[];
}
