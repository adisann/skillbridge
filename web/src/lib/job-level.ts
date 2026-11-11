/**
 * Level lowongan untuk filter. Label dari judul lowongan diutamakan; jika judul tidak memuat level,
 * level ditentukan dari syarat pengalaman minimum (Junior < 2 tahun, Mid 2–4 tahun, Senior ≥ 4 tahun).
 */
interface JobLevel {
  value: string;
  label: string;
  minYears?: number;
  maxYears?: number;
}

export const JOB_LEVELS: JobLevel[] = [
  { value: "Internship", label: "Magang" },
  { value: "Junior", label: "Junior / Entry (0–2 tahun)", minYears: 0, maxYears: 2 },
  { value: "Mid", label: "Mid-level (2–4 tahun)", minYears: 2, maxYears: 4 },
  { value: "Senior", label: "Senior (4+ tahun)", minYears: 4 },
  { value: "Lead", label: "Lead / Manajerial" },
];

export function matchesJobLevel(seniority: string | null | undefined, experienceYearsMin: number | null | undefined, level: string): boolean {
  if (!level || level === "all") return true;
  const label = (seniority || "").trim().toLowerCase();
  if (label) return label.includes(level.toLowerCase());
  const range = JOB_LEVELS.find((l) => l.value.toLowerCase() === level.toLowerCase());
  if (range?.minYears == null || experienceYearsMin == null) return false;
  return experienceYearsMin >= range.minYears && (range.maxYears == null || experienceYearsMin < range.maxYears);
}
