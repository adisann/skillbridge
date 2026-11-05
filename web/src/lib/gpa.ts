/** Utilitas IPK (skala 4,00): ekstraksi dari teks CV, validasi input, dan perbandingan dengan syarat lowongan. */

const GPA_KEYWORD = /\b(?:ipk|gpa|indeks\s+prestasi(?:\s+kumulatif)?)\b/gi;
const GPA_NUMBER = /(?<![\d.,])([0-4](?:[.,]\d{1,2})?)(?!\d)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?/;
const MIN_REALISTIC_GPA = 1;
const MAX_GPA = 4;

const toNumber = (raw: string) => Number.parseFloat(raw.replace(",", "."));

/** Validasi nilai IPK dari form/DB. Mengembalikan null jika kosong atau di luar 1,00 - 4,00. */
export function parseGpaValue(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = typeof raw === "number" ? raw : toNumber(String(raw).trim());
  if (!Number.isFinite(value) || value < MIN_REALISTIC_GPA || value > MAX_GPA) return null;
  return Math.round(value * 100) / 100;
}

/** Cari IPK pada teks CV, mis. "IPK: 3,75 / 4,00" atau "GPA 3.8". Skala selain 4 diabaikan. */
export function extractGpaFromText(text: string): number | null {
  for (const keyword of text.matchAll(GPA_KEYWORD)) {
    const start = (keyword.index ?? 0) + keyword[0].length;
    const found = text.slice(start, start + 40).match(GPA_NUMBER);
    if (!found) continue;
    if (found[2] && toNumber(found[2]) !== MAX_GPA) continue;
    const value = parseGpaValue(found[1]);
    if (value !== null) return value;
  }
  return null;
}

type GpaFit = "meets" | "below" | "unknown";

/** Bandingkan IPK kandidat dengan syarat minimum; "unknown" bila salah satunya tidak tersedia. */
export function compareGpa(candidate: number | null | undefined, minimum: number | null | undefined): GpaFit {
  if (candidate == null || minimum == null) return "unknown";
  return candidate >= minimum ? "meets" : "below";
}

/** Skor komponen IPK (0.4 - 1.0): penuh bila memenuhi, turun proporsional bila di bawah syarat. */
export function gpaScore(candidate: number, minimum: number): number {
  if (candidate >= minimum) return 1;
  return Math.max(0.4, candidate / minimum);
}

/** Format gaya Indonesia: 3,75 */
export function formatGpa(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
