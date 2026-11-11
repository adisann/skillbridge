/**
 * Konfigurasi Bobot dan Ambang Kategori Matching SkillBridge
 * Acuan: AGENTS.md Bagian 9 (Matching) & docs/user-requirements.md (FR-05, FR-06, AC-02, AC-05, AC-06)
 */

export interface MatchingWeights {
  mandatorySkills: number;     // Bobot awal 0.35
  preferredSkills: number;     // Bobot awal 0.20
  experience: number;          // Bobot awal 0.15
  educationSeniority: number;  // Bobot awal 0.10
  semantic: number;            // Bobot awal 0.20
}

export interface MatchingThresholds {
  /** Ambang batas skor minimum untuk kategori 'match' (dalam rentang 0-100) */
  matchScoreMin: number;
  /** Rasio minimum pemenuhan skill wajib untuk kategori 'match' (0.0 - 1.0) */
  mandatoryRatioMin: number;
  /** Selisih tahun pengalaman kandidat di atas syarat minimum untuk memicu 'potentially_overqualified' */
  overqualifiedMinExperienceDiff: number;
  /** Ambang batas minimum jumlah skill teknis sebelum dinyatakan 'insufficient_evidence' */
  insufficientEvidenceMinSkills: number;
  seniorMinExperienceYears: number;
  midMinExperienceYears: number;
}

/**
 * Bobot baku sesuai acuan AGENTS.md Bagian 9:
 * 0.35 skill wajib + 0.20 skill tambahan + 0.15 pengalaman + 0.10 senioritas/pendidikan + 0.20 semantic
 */
export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  mandatorySkills: 0.35,
  preferredSkills: 0.20,
  experience: 0.15,
  educationSeniority: 0.10,
  semantic: 0.20,
};

/**
 * Ambang batas status indikatif kualifikasi
 */
export const DEFAULT_MATCHING_THRESHOLDS: MatchingThresholds = {
  matchScoreMin: 68,
  mandatoryRatioMin: 0.70,
  overqualifiedMinExperienceDiff: 4, // Misal: syarat 1-2 tahun, kandidat punya 6+ tahun
  insufficientEvidenceMinSkills: 1,  // CV dengan 0 atau < 1 skill teknis
  seniorMinExperienceYears: 4,
  midMinExperienceYears: 2,
};

export const MATCH_STATUS_LABELS = {
  match: "Memenuhi kualifikasi",
  underqualified: "Belum memenuhi kualifikasi",
  potentially_overqualified: "Berpotensi melebihi kualifikasi",
  insufficient_evidence: "Bukti belum cukup",
} as const;

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
  "data visualization": "data visualization",
  "visualisasi data": "data visualization",
  "machine learning": "machine learning",
  "pembelajaran mesin": "machine learning",
  "a/b testing": "a/b testing",
  "ab testing": "a/b testing",
  "statistics": "statistics",
  "statistika": "statistics",
};

export function getCanonicalSkill(name: string): string {
  if (!name) return "";
  const clean = name.trim().toLowerCase();
  return SKILL_CANONICAL_MAP[clean] || clean;
}

/**
 * Pemetaan skill serumpun untuk mendeteksi status "Belum cukup bukti" (AC-02)
 * Ketika kandidat memiliki skill dalam domain yang sama namun belum mencantumkan alat spesifik tersebut.
 */
export const RELATED_SKILLS_MAP: Record<string, string[]> = {
  sql: ["mysql", "postgresql", "postgres", "sqlite", "tsql", "plsql", "oracle", "database", "querying"],
  python: ["r", "pandas", "numpy", "scikit-learn", "data analysis", "scripting"],
  tableau: ["power bi", "powerbi", "metabase", "looker", "google looker studio", "data visualization", "bi tools", "excel"],
  "power bi": ["tableau", "metabase", "looker", "dax", "power query", "data visualization", "bi tools", "excel"],
  excel: ["google sheets", "spreadsheet", "vba", "macros", "pivot table"],
  statistics: ["a/b testing", "probability", "hypothesis testing", "regression", "quantitative analysis", "math"],
  "a/b testing": ["statistics", "experimentation", "hypothesis testing", "data analysis"],
  etl: ["data pipeline", "sql", "python", "data warehousing", "airflow", "dbt"],
  "data modeling": ["sql", "database design", "er diagram", "star schema", "relational database"],
  "machine learning": ["python", "r", "scikit-learn", "tensorflow", "statistics", "predictive modeling"],
};

