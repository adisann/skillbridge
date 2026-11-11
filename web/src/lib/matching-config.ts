/**
 * Konfigurasi bobot dan ambang status kecocokan SkillBridge.
 * Acuan kebutuhan: docs/user-requirements.md (FR-05, FR-06, AC-02, AC-05, AC-06).
 */

import { languageFamily, languageQualification } from "./language-skills.ts";
import { canonicalSkillLabel } from "./skill-taxonomy.ts";

export interface MatchingWeights {
  mandatorySkills: number;     // Bobot awal 0.35
  preferredSkills: number;     // Bobot awal 0.20
  experience: number;          // Bobot awal 0.15
  educationGpa: number;        // Bobot awal 0.10
  semantic: number;            // Bobot awal 0.20
}

export interface MatchingThresholds {
  /** Rasio minimum pemenuhan skill wajib untuk kategori 'match' (0.0 - 1.0) */
  mandatoryRatioMin: number;
  /** Selisih tahun pengalaman kandidat di atas syarat minimum untuk memicu 'potentially_overqualified' */
  overqualifiedMinExperienceDiff: number;
  /** Ambang batas minimum jumlah skill CV sebelum dinyatakan 'insufficient_evidence' */
  insufficientEvidenceMinSkills: number;
}

/**
 * Bobot dasar: 0.35 skill wajib + 0.20 skill tambahan + 0.15 pengalaman + 0.10 pendidikan/IPK + 0.20 semantik.
 * Komponen tanpa data dikeluarkan dan bobotnya dibagi ke komponen lain.
 */
export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  mandatorySkills: 0.35,
  preferredSkills: 0.20,
  experience: 0.15,
  educationGpa: 0.10,
  semantic: 0.20,
};

/**
 * Ambang batas status indikatif kualifikasi
 */
export const DEFAULT_MATCHING_THRESHOLDS: MatchingThresholds = {
  mandatoryRatioMin: 1,
  overqualifiedMinExperienceDiff: 4, // Misal: syarat 1-2 tahun, kandidat punya 6+ tahun
  insufficientEvidenceMinSkills: 1,  // CV belum memuat skill yang dapat dievaluasi
};

export const MATCH_STATUS_LABELS = {
  match: "Memenuhi kualifikasi",
  underqualified: "Belum memenuhi kualifikasi",
  potentially_overqualified: "Berpotensi melebihi kualifikasi",
  insufficient_evidence: "Bukti CV belum cukup",
} as const;

export function getMatchStatusLabel(status: keyof typeof MATCH_STATUS_LABELS, reason?: "job_data_incomplete" | "cv_data_incomplete" | null): string {
  return status === "insufficient_evidence" && reason === "job_data_incomplete"
    ? "Data lowongan belum lengkap"
    : MATCH_STATUS_LABELS[status];
}

export const MATCH_STATUS_COLORS = {
  match: "var(--sb-good)",
  underqualified: "var(--sb-warning)",
  potentially_overqualified: "var(--sb-blue)",
  insufficient_evidence: "var(--sb-mist)",
} as const;

/**
 * Pemetaan alias kanonikal skill untuk memastikan normalisasi (misal: "Microsoft Excel" == "Excel", "PowerBI" == "Power BI")
 */
const SKILL_CANONICAL_MAP: Record<string, string> = {
  "ibm spss": "spss",
  "microsoft excel": "excel",
  "ms excel": "excel",
  "excel": "excel",
  "microsoft power bi": "power bi",
  "powerbi": "power bi",
  "power bi": "power bi",
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "reactjs": "react",
  "react.js": "react",
  "react": "react",
  "nodejs": "node.js",
  "node": "node.js",
  "typescript": "typescript",
  "ts": "typescript",
  "javascript": "javascript",
  "js": "javascript",
  "golang": "go",
  "google looker studio": "looker",
  "google data studio": "looker",
  "looker studio": "looker",
  "looker": "looker",
};

export function getCanonicalSkill(name: string): string {
  if (!name) return "";
  const clean = canonicalSkillLabel(name).toLowerCase();
  const qualification = languageQualification(clean);
  if (qualification) return qualification.skill.toLowerCase();
  const language = languageFamily(clean);
  if (language) return language;
  return SKILL_CANONICAL_MAP[clean] || clean;
}

