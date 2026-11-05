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
  mandatoryRatioMin: 0.50,
  overqualifiedMinExperienceDiff: 4, // Misal: syarat 1-2 tahun, kandidat punya 6+ tahun
  insufficientEvidenceMinSkills: 1,  // CV dengan 0 atau < 1 skill teknis
};

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

