/**
 * Lowongan contoh (seed/demo) yang tidak boleh tampil sebagai lowongan nyata.
 *
 * Hasil audit 10 Nov 2026: beberapa entri seed memakai nama perusahaan karangan dengan URL
 * lowongan perusahaan lain (mis. "PT Nusantara FinTech" -> lowongan Cloudflare London), atau
 * URL placeholder (`.../job/seed-fe-01`). Entri ini tetap ada di database (tidak dihapus),
 * tapi dikeluarkan dari katalog publik, statistik, tren skill, dan rekomendasi.
 */
const DEMO_EXTERNAL_IDS = new Set([
  // Dari worker/sources/jobs_seed.json: identitas perusahaan tidak cocok dengan URL sumbernya
  "gh-40112",
  "li-412988102",
  "lev-88a2e1",
  // Dari supabase/migrations/20261103000002_seed_demo_and_jobs.sql
  "gh-8109620",
  "li-4478504092-seed",
  "lev-5f40e053-seed",
]);

/** Baris seed SQL memakai UUID tetap berawalan ini. */
const DEMO_ID_PREFIX = "33333333-0000-0000-0000-";

export interface JobIdentity {
  id?: string | null;
  external_id?: string | null;
  retrieval_method?: string | null;
}

export function isDemoJob(job: JobIdentity): boolean {
  const ext = (job.external_id || "").toLowerCase();
  return (
    job.retrieval_method === "seed" ||
    DEMO_EXTERNAL_IDS.has(ext) ||
    ext.startsWith("seed-") ||
    ext.endsWith("-seed") ||
    (job.id || "").startsWith(DEMO_ID_PREFIX)
  );
}

export const DEMO_JOB_NOTICE =
  "Ini lowongan contoh untuk demonstrasi. Perusahaan dan tautan sumbernya bukan lowongan nyata.";

/** Nama cadangan lama dari crawler/OCR saat perusahaan tidak tertulis. Bukan tanda verifikasi. */
const LEGACY_PLACEHOLDER_COMPANY = "perusahaan terverifikasi";
export const UNKNOWN_COMPANY = "Perusahaan tidak disebutkan";

export function displayCompany(company: string | null | undefined): string {
  const value = (company || "").trim();
  return !value || value.toLowerCase() === LEGACY_PLACEHOLDER_COMPANY ? UNKNOWN_COMPANY : value;
}
