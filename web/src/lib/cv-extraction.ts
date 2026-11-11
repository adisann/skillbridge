/**
 * Ekstraksi skill dan durasi pengalaman dari teks CV (rule-based, tanpa AI).
 * Hasilnya draf: pengguna tetap meninjau dan mengoreksi sebelum disimpan.
 * File ini sengaja tanpa import alias "@/" agar bisa diuji langsung dengan node --test.
 */

import { HSK_SKILL_RULES, MANDARIN_SKILL_RULE, JAPANESE_SKILL_RULE, JLPT_SKILL_RULES, languageFamily, languageQualification } from "./language-skills.ts";
import { TRANSLATED_SKILL_RULES, canonicalSkillLabel } from "./skill-taxonomy.ts";

interface SkillRule {
  name: string;
  regex: RegExp;
}

// Taksonomi aturan regex dengan boundary kata (mencegah salah deteksi huruf tunggal seperti 'r')
const BASE_SKILL_RULES: SkillRule[] = [
  MANDARIN_SKILL_RULE,
  ...HSK_SKILL_RULES,
  JAPANESE_SKILL_RULE,
  ...JLPT_SKILL_RULES,
  ...TRANSLATED_SKILL_RULES,
  { name: "Python", regex: /\b(python|python3|py)\b/i },
  { name: "SQL", regex: /\b(sql|pl\/sql)\b/i },
  { name: "PostgreSQL", regex: /\b(postgresql|postgres)\b/i },
  { name: "MySQL", regex: /\bmysql\b/i },
  { name: "JavaScript", regex: /\b(javascript|js|ecmascript|node\.?js)\b/i },
  { name: "PHP", regex: /\b(php|mvc\s*php)\b/i },
  { name: "Laravel", regex: /\b(laravel)\b/i },
  { name: "Django", regex: /\b(django)\b/i },
  { name: "Microsoft Excel", regex: /\b(microsoft\s*excel|ms\s*excel|excel|pivot\s*tables?)\b/i },
  { name: "Microsoft Office", regex: /\b(microsoft\s*office|ms\s*office|office\s*365)\b/i },
  { name: "Tableau", regex: /\b(tableau)\b/i },
  { name: "Looker", regex: /\b(looker|looker\s*studio|google\s*data\s*studio)\b/i },
  { name: "Power BI", regex: /\b(power\s*bi|powerbi|dax)\b/i },
  { name: "Data Analysis", regex: /\b(data\s*analysis|data\s*analytics|analisis\s*data|analisa\s*data)\b/i },
  { name: "Data Visualization", regex: /\b(data\s*visuali[sz]ation|visualisasi\s*data)\b/i },
  { name: "Web Scraping", regex: /\b(web\s*scraping|scraping|selenium|beautifulsoup|bs4)\b/i },
  { name: "Pandas", regex: /\b(pandas)\b/i },
  { name: "Machine Learning", regex: /\b(machine\s*learning|scikit-learn|lightgbm|xgboost|tensorflow|pytorch)\b/i },
  { name: "Deep Learning", regex: /\b(deep\s*learning)\b/i },
  { name: "Data Science", regex: /\b(data\s*science|sains\s*data|data\s*scientist)\b/i },
  { name: "Business Analytics", regex: /\b(business\s*analytics|analitika\s*bisnis|business\s*analysis)\b/i },
  { name: "Data Cleaning", regex: /\b(data\s*cleaning|pembersihan\s*data|data\s*preprocessing)\b/i },
  { name: "Data Modeling", regex: /\b(data\s*modell?ing|predictive\s*modell?ing|pemodelan\s*data)\b/i },
  { name: "Database Management", regex: /\b(database\s*management|database|basis\s*data|dbms)\b/i },
  { name: "Git", regex: /\b(git|github|gitlab)\b/i },
  { name: "Statistics", regex: /\b(statistics|statistika|statistical)\b/i },
  { name: "Project Management", regex: /\b(project\s*management|manajemen\s*proyek)\b/i },
  { name: "ETL", regex: /\b(etl|data\s*pipeline)\b/i },
  { name: "BigQuery", regex: /\b(?:google\s+)?big\s*query\b/i },
  { name: "SPSS", regex: /\b(?:ibm\s+)?spss\b/i },
  { name: "Snowflake", regex: /\b(snowflake)\b/i },
  { name: "dbt", regex: /\b(dbt|data\s*build\s*tool)\b/i },
  { name: "Metabase", regex: /\b(metabase)\b/i },
  { name: "A/B Testing", regex: /\b(a\/b\s*testing|ab\s*testing)\b/i },
  { name: "R", regex: /\b(bahasa\s*r|r\s*programming|r-project|rstudio)\b/i },
];

export const SKILL_RULES: SkillRule[] = [...BASE_SKILL_RULES.reduce((map, rule) => {
  const name = canonicalSkillLabel(rule.name);
  const previous = map.get(name);
  map.set(name, { name, regex: previous ? new RegExp(`(?:${previous.regex.source})|(?:${rule.regex.source})`, "iu") : rule.regex });
  return map;
}, new Map<string, SkillRule>()).values()];

export function detectSkills(text: string): string[] {
  const skills = [...new Set(SKILL_RULES.filter((rule) => rule.regex.test(text)).map((rule) => canonicalSkillLabel(rule.name)))];
  const qualifiedLanguages = new Set(skills.flatMap((skill) => languageQualification(skill)?.language ? [languageQualification(skill)!.language] : []));
  return skills.filter((skill) => languageQualification(skill) || !qualifiedLanguages.has(languageFamily(skill)!));
}

// ---------------------------------------------------------------------------
// Durasi pengalaman
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1, pebruari: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agt: 7, ags: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, nopember: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11,
};

const MONTH_WORD = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");
// Satu titik waktu: "Jan 2022", "Januari 2022", "01/2022", "2022-01", atau hanya "2022"
const POINT = `(?:(?:${MONTH_WORD})\\.?\\s+\\d{4}|\\d{1,2}[/.-]\\d{4}|\\d{4}[/.-]\\d{1,2}|\\d{4})`;
const PRESENT = "(?:sekarang|saat\\s+ini|kini|present|current|now|today)";
const RANGE = new RegExp(`(${POINT})\\s*(?:-|–|—|s\\.?\\/?d\\.?|sampai|hingga|to|until)\\s*(${POINT}|${PRESENT})`, "gi");

const EXPERIENCE_HEADING = /^(?:pengalaman(?:\s+(?:kerja|profesional|magang|organisasi))?|riwayat\s+pekerjaan|work\s+experience|professional\s+experience|employment(?:\s+history)?|experience|internships?|pengalaman\s+magang)\s*:?$/i;
const OTHER_HEADING = /^(?:pendidikan|riwayat\s+pendidikan|education|keahlian|skills?|kemampuan|proyek|projects?|sertifikasi|certifications?|pelatihan|trainings?|organisasi|organizations?|penghargaan|awards?|prestasi|achievements?|publikasi|publications?|bahasa|languages?|referensi|references?|ringkasan|summary|profil|profile|tentang\s+saya|about\s+me|kontak|contact|volunteer(?:ing)?|kegiatan)\s*:?$/i;

/** Ambil teks bagian pengalaman kerja. Kosong bila CV tidak punya judul bagian yang dikenali. */
function experienceSection(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inside = false;
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.replace(/[^\p{L}\s:]/gu, "").trim();
    if (heading.length <= 40 && EXPERIENCE_HEADING.test(heading)) {
      inside = true;
      continue;
    }
    if (inside && heading.length <= 40 && OTHER_HEADING.test(heading)) {
      inside = false;
      continue;
    }
    if (inside) out.push(line);
  }
  return out.join("\n");
}

function parsePoint(value: string, isEnd: boolean): number | null {
  const v = value.trim().toLowerCase().replace(/\./g, " ").replace(/\s+/g, " ");
  let m = v.match(new RegExp(`^(${MONTH_WORD})\\s+(\\d{4})$`));
  if (m) return Number(m[2]) * 12 + MONTHS[m[1]];
  m = value.trim().match(/^(\d{1,2})[/.-](\d{4})$/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return Number(m[2]) * 12 + Number(m[1]) - 1;
  m = value.trim().match(/^(\d{4})[/.-](\d{1,2})$/);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return Number(m[1]) * 12 + Number(m[2]) - 1;
  m = value.trim().match(/^(\d{4})$/);
  // Hanya tahun: anggap awal tahun untuk mulai, akhir tahun untuk selesai
  if (m) return Number(m[1]) * 12 + (isEnd ? 11 : 0);
  return null;
}

/**
 * Durasi dari rentang tanggal. Rentang yang tumpang tindih (pekerjaan paralel) digabung,
 * jadi bulan yang sama tidak dihitung dua kali.
 */
export function monthsFromDateRanges(text: string, now: Date = new Date()): number | null {
  const nowMonth = now.getFullYear() * 12 + now.getMonth();
  const intervals: Array<[number, number]> = [];
  for (const match of text.matchAll(RANGE)) {
    const start = parsePoint(match[1], false);
    const end = new RegExp(`^${PRESENT}$`, "i").test(match[2].trim()) ? nowMonth : parsePoint(match[2], true);
    if (start === null || end === null || end < start) continue;
    const year = Math.floor(start / 12);
    if (year < 1970 || end > nowMonth + 1) continue;
    intervals.push([start, Math.min(end, nowMonth)]);
  }
  if (!intervals.length) return null;
  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [curStart, curEnd] = intervals[0];
  for (const [s, e] of intervals.slice(1)) {
    if (s <= curEnd + 1) curEnd = Math.max(curEnd, e);
    else {
      total += curEnd - curStart + 1;
      [curStart, curEnd] = [s, e];
    }
  }
  total += curEnd - curStart + 1;
  return total;
}

/**
 * Durasi yang ditulis eksplisit, mis. "2 tahun pengalaman" atau "1 tahun 6 bulan".
 * Tahun dan bulan hanya dijumlahkan bila berada dalam satu frasa yang sama; bila ada beberapa frasa,
 * diambil yang terbesar (frasa ringkasan biasanya sudah mencakup semuanya).
 */
function monthsFromExplicitDuration(text: string): number | null {
  const lower = text.toLowerCase();
  let best: number | null = null;
  const phrase = /(\d+(?:[.,]\d+)?)\s*\+?\s*(tahun|thn|years?|yrs?)(?:\s*(?:dan|and|,)?\s*(\d+)\s*(bulan|months?|mos?)\b)?|(\d+)\s*(bulan|months?|mos?)\b/g;
  for (const m of lower.matchAll(phrase)) {
    const months = m[1] !== undefined
      ? Math.round(Number(m[1].replace(",", ".")) * 12) + Number(m[3] || 0)
      : Number(m[5]);
    if (months > 0 && months <= 50 * 12) best = Math.max(best ?? 0, months);
  }
  return best;
}

/**
 * Perkiraan total pengalaman dalam tahun (draf untuk ditinjau pengguna).
 * Urutan sumber: rentang tanggal di bagian pengalaman → durasi eksplisit di bagian pengalaman →
 * durasi eksplisit di seluruh CV → 0 bila ditulis fresh graduate → null.
 */
export function extractExperienceYears(text: string, now: Date = new Date()): number | null {
  const section = experienceSection(text);
  const fromRanges = section ? monthsFromDateRanges(section, now) : null;
  const months =
    fromRanges ??
    (section ? monthsFromExplicitDuration(section) : null) ??
    monthsFromExplicitDuration(text);
  if (months !== null) return Math.round((months / 12) * 100) / 100;
  return /fresh\s*graduate|lulusan\s+baru/i.test(text) ? 0 : null;
}
