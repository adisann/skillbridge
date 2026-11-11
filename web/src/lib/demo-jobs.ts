/** Penanda lowongan contoh dari seed worker dan migrasi lama. */
const DEMO_EXTERNAL_IDS = new Set([
  "gh-40112",
  "li-412988102",
  "lev-88a2e1",
  "gh-8109620",
]);

/** Baris seed SQL memakai UUID tetap berawalan ini. */
const DEMO_ID_PREFIX = "33333333-0000-0000-0000-";

interface JobIdentity {
  id?: string | null;
  external_id?: string | null;
  retrieval_method?: string | null;
  source_name?: string | null;
}

export function isDemoJob(job: JobIdentity): boolean {
  const ext = (job.external_id || "").toLowerCase();
  return (
    job.retrieval_method === "seed" ||
    job.source_name?.toLowerCase() === "seed" ||
    DEMO_EXTERNAL_IDS.has(ext) ||
    ext.startsWith("seed-") ||
    ext.endsWith("-seed") ||
    (job.id || "").startsWith(DEMO_ID_PREFIX)
  );
}

/** Nama cadangan lama dari crawler/OCR saat perusahaan tidak tertulis. Bukan tanda verifikasi. */
const LEGACY_PLACEHOLDER_COMPANY = "perusahaan terverifikasi";
const UNKNOWN_COMPANY = "Perusahaan tidak disebutkan";

export function displayCompany(company: string | null | undefined): string {
  const value = (company || "").trim();
  return !value || value.toLowerCase() === LEGACY_PLACEHOLDER_COMPANY ? UNKNOWN_COMPANY : value;
}
