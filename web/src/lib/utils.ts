import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Daftarkan token jarak `stack-*` (lihat globals.css) agar cn() bisa menimpa kelas jarak dengan benar,
// mis. cn("p-stack-lg", "p-stack-md") → "p-stack-md".
const SPACING_TOKENS = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl"].map((t) => `stack-${t}`);
const twMerge = extendTailwindMerge({ extend: { theme: { spacing: SPACING_TOKENS } } });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Daftar akronim/singkatan yang harus tetap huruf kapital
const PRESERVED_ACRONYMS = new Set([
  "UI/UX",
  "UI",
  "UX",
  "BI",
  "SQL",
  "IT",
  "AI",
  "ML",
  "HR",
  "QA",
  "QC",
  "SEO",
  "SEM",
  "CTO",
  "CEO",
  "COO",
  "CFO",
  "VP",
  "WFO",
  "WFH",
  "API",
  "ERP",
  "CRM",
  "SRE",
  "AWS",
  "GCP",
  "PPIC",
  "B2B",
  "B2C",
  "DKI",
  "PT",
  "CV",
  "PHP",
  "Go",
  "Golang",
  "DevOps",
]);

/**
 * Format judul lowongan:
 * Jika judul huruf kapital semua (ALL CAPS), ubah menjadi Title Case.
 * Akronim teknis umum (UI/UX, BI, SQL, IT, WFO, dll.) tetap dipertahankan kapital.
 * Jika judul sudah mixed-case, pertahankan aslinya.
 */
export function formatJobTitle(title?: string | null): string {
  if (!title) return "";
  const trimmed = title.trim();
  if (!trimmed) return "";

  // Cek apakah string hanya terdiri dari huruf kapital (abaikan simbol & angka)
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const isAllUpper = hasLetters && trimmed === trimmed.toUpperCase();

  if (!isAllUpper) {
    return trimmed;
  }

  // Ubah ke Title Case dengan mempertahankan akronim
  return trimmed.toLowerCase().replace(/\b([a-z0-9/]+)\b/gi, (match) => {
    const upper = match.toUpperCase();
    for (const acr of PRESERVED_ACRONYMS) {
      if (upper === acr.toUpperCase()) {
        return acr;
      }
    }
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });
}

/**
 * Deteksi apakah lokasi lowongan berada di luar Indonesia (mis. Hong Kong, Singapura, dsb.)
 */
export function isOverseasLocation(location?: string | null): boolean {
  if (!location) return false;
  const loc = location.toLowerCase();

  const foreignKeywords = [
    "hong kong",
    "singapore",
    "taiwan",
    "pune",
    "bengaluru",
    "bangalore",
    "karnataka",
    "india",
    "malaysia",
    "kuala lumpur",
    "tokyo",
    "japan",
    "seoul",
    "korea",
    "china",
    "bangkok",
    "thailand",
    "vietnam",
    "philippines",
    "manila",
    "australia",
    "sydney",
    "melbourne",
    "united kingdom",
    "london",
    "united states",
    "usa",
    "overseas",
    "luar negeri",
  ];

  return foreignKeywords.some((kw) => loc.includes(kw));
}
