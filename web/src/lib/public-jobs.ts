import { isDemoJob } from "@/lib/demo-jobs";
import { unstable_cache, revalidateTag } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getCanonicalSkill } from "@/lib/matching-config";
import { getCategoryFromTitle, getCategoryBySlug } from "@/lib/job-categories";
import { isOverseasLocation } from "@/lib/utils";

interface RawPublicJobSkill {
  is_mandatory: boolean;
  requirement_snippet?: string;
  skills: {
    id: string;
    name: string;
    category?: string;
  };
}

export interface RawPublicJob {
  id: string;
  external_id?: string;
  title: string;
  canonical_title: string;
  company: string;
  location: string;
  employment_type: string;
  seniority?: string;
  experience_years_min?: number;
  education?: string;
  min_gpa?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  description: string;
  source_name: string;
  source_url: string;
  retrieval_method: string;
  retrieved_at: string;
  expires_at?: string;
  content_hash?: string;
  is_active: boolean;
  job_skills: RawPublicJobSkill[];
}

/**
 * Mengambil katalog lowongan publik aktif dari database.
 * Di-cache di memory server dengan unstable_cache selama 15 menit (tag: 'jobs').
 */
export const getCachedPublicJobs = unstable_cache(
  async (): Promise<RawPublicJob[]> => {
    try {
      const supabase = getServiceSupabase();
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*, job_skills(is_mandatory, requirement_snippet, skills(id, name, category))")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[getCachedPublicJobs] Gagal membaca jobs:", error.message);
        return [];
      }

      // Lowongan contoh/seed tidak ikut katalog publik, statistik, tren skill, maupun rekomendasi
      return ((jobs || []) as unknown as RawPublicJob[]).filter((job) => !isDemoJob(job));
    } catch (err) {
      console.error("[getCachedPublicJobs] Exception:", err);
      return [];
    }
  },
  ["public_jobs_catalog"],
  {
    revalidate: 900, // 15 menit
    tags: ["jobs"],
  }
);

/**
 * Menginvalidasi cache katalog lowongan publik saat crawler / admin menyimpan lowongan baru.
 */
export function revalidateJobsCache() {
  try {
    (revalidateTag as unknown as (tag: string) => void)("jobs");
  } catch (err) {
    console.warn("[revalidateJobsCache] Gagal revalidate tag:", err);
  }
}

interface MarketFilterInput {
  role?: string | null;
  workType?: string | null;
  seniority?: string | null;
  location?: string | null;
  postedDate?: string | null;
}

interface AggregatedSkillInsight {
  skillName: string;
  category: string;
  frequencyCount: number;
  mandatoryCount: number;
  percentage: number;
  cvStatus: "tercantum" | "belum_ditemukan" | "perlu_verifikasi" | "ditambahkan_pengguna";
  statusLabel: string;
  exampleRequirement: string;
}

interface LearningRecommendation {
  skillName: string;
  demandPercentage: number;
  reason: string;
  priority: string;
  action: string;
}

interface MarketAggregationResult {
  sampleSizeN: number;
  lastUpdatedDate: string;
  topSkills: AggregatedSkillInsight[];
  learningRecommendations: LearningRecommendation[];
}

/**
 * Fungsi kanonikal agregasi data pasar kerja (SATU SUMBER ANGKA PASAR).
 * Digunakan secara seragam oleh Dashboard, /insights, dan Landing Page.
 * Memastikan filter diterapkan SEBELUM agregasi skill, dan N adalah denominator yang sama.
 */
export function aggregateMarketData(
  allJobs: RawPublicJob[],
  filters: MarketFilterInput,
  userCvSkills: { verified: string[]; claimed?: string[]; review?: string[] } = { verified: [], claimed: [] }
): MarketAggregationResult {
  const role = filters.role && filters.role !== "all" ? filters.role.toLowerCase() : "all";
  const location = filters.location && filters.location !== "all" ? filters.location.toLowerCase() : "all";
  const workType = filters.workType && filters.workType !== "all" ? filters.workType.toLowerCase() : "all";
  const seniority = filters.seniority && filters.seniority !== "all" ? filters.seniority.toLowerCase() : "all";
  const postedDate = filters.postedDate && filters.postedDate !== "all" ? filters.postedDate : "all";

  // 1. Terapkan seluruh filter lowongan SEBELUM agregasi skill
  let filteredJobs = allJobs;

  if (role !== "all") {
    const catFilter = getCategoryBySlug(role);
    filteredJobs = filteredJobs.filter((j) => {
      if (catFilter) {
        const jCat = getCategoryFromTitle(j.title, j.canonical_title);
        if (jCat.slug === catFilter.slug) return true;
      }
      const cTitle = (j.canonical_title || "").toLowerCase();
      const title = (j.title || "").toLowerCase();
      return cTitle.includes(role) || title.includes(role);
    });
  }

  if (location === "overseas") {
    filteredJobs = filteredJobs.filter((j) => isOverseasLocation(j.location));
  } else if (location !== "all") {
    filteredJobs = filteredJobs.filter((j) => {
      const jLoc = (j.location || "").toLowerCase();
      if (location === "remote") return jLoc.includes("remote");
      return jLoc.includes(location);
    });
  } else {
    // Default daftar: lowongan di luar Indonesia tidak masuk default daftar
    filteredJobs = filteredJobs.filter((j) => !isOverseasLocation(j.location));
  }

  if (workType !== "all") {
    filteredJobs = filteredJobs.filter((j) => {
      const loc = (j.location || "").toLowerCase();
      const emp = (j.employment_type || "").toLowerCase();
      if (workType === "remote") return loc.includes("remote") || emp.includes("remote");
      if (workType === "hybrid") return loc.includes("hybrid") || emp.includes("hybrid");
      if (workType === "onsite") {
        return !loc.includes("remote") && !loc.includes("hybrid") && !emp.includes("remote") && !emp.includes("hybrid");
      }
      return true;
    });
  }

  if (seniority !== "all") {
    filteredJobs = filteredJobs.filter((j) =>
      (j.seniority || "").toLowerCase().includes(seniority)
    );
  }

  if (postedDate !== "all") {
    const nowMs = Date.now();
    const days = postedDate === "7d" ? 7 : postedDate === "14d" ? 14 : 30;
    const maxAgeMs = days * 24 * 60 * 60 * 1000;
    filteredJobs = filteredJobs.filter((j) => {
      const retDate = j.retrieved_at ? new Date(j.retrieved_at).getTime() : 0;
      return nowMs - retDate <= maxAgeMs;
    });
  }

  const sampleSizeN = filteredJobs.length;

  // 2. Agregasi skill unik per posting lowongan
  const skillCounts: Record<
    string,
    { count: number; mandatoryCount: number; category: string; snippet: string }
  > = {};

  for (const job of filteredJobs) {
    const seenJobSkills = new Set<string>();

    for (const js of job.job_skills || []) {
      const sName = js.skills?.name;
      if (!sName) continue;

      const normName = sName.trim();
      const lower = normName.toLowerCase();
      if (seenJobSkills.has(lower)) continue;
      seenJobSkills.add(lower);

      if (!skillCounts[normName]) {
        skillCounts[normName] = {
          count: 0,
          mandatoryCount: 0,
          category: js.skills?.category || "Data Analysis",
          snippet: js.requirement_snippet || `Persyaratan kualifikasi ${normName}`,
        };
      }

      skillCounts[normName].count++;
      if (js.is_mandatory) {
        skillCounts[normName].mandatoryCount++;
      }
    }
  }

  // 3. Normalisasi himpunan skill CV kandidat
  const verifiedSet = new Set((userCvSkills.verified || []).map((s) => s.trim().toLowerCase()));
  const canonicalVerifiedSet = new Set((userCvSkills.verified || []).map((s) => getCanonicalSkill(s)));
  const reviewSet = new Set((userCvSkills.review || []).map((s) => getCanonicalSkill(s)));
  const claimedSet = new Set((userCvSkills.claimed || []).map((s) => s.trim().toLowerCase()));
  const canonicalClaimedSet = new Set((userCvSkills.claimed || []).map((s) => getCanonicalSkill(s)));

  // 4. Perankingan skill
  const rankedSkills: AggregatedSkillInsight[] = Object.entries(skillCounts)
    .map(([name, info]) => {
      const n = info.count;
      const percentage = sampleSizeN > 0 ? Math.min(100, Math.round((n / sampleSizeN) * 100)) : 0;
      const lower = name.toLowerCase();
      const canon = getCanonicalSkill(name);

      let cvStatus: "tercantum" | "belum_ditemukan" | "perlu_verifikasi" | "ditambahkan_pengguna" = "belum_ditemukan";
      let statusLabel = "Belum ada di CV-mu";

      if (reviewSet.has(canon)) {
        cvStatus = "perlu_verifikasi"; statusLabel = "Perlu verifikasi";
      } else if (verifiedSet.has(lower) || canonicalVerifiedSet.has(canon)) {
        cvStatus = "tercantum";
        statusLabel = "Tercantum di CV";
      } else if (claimedSet.has(lower) || canonicalClaimedSet.has(canon)) {
        cvStatus = "ditambahkan_pengguna";
        statusLabel = "Ditambahkan oleh pengguna";
      }

      return {
        skillName: name,
        category: info.category,
        frequencyCount: n,
        mandatoryCount: info.mandatoryCount,
        percentage,
        cvStatus,
        statusLabel,
        exampleRequirement: info.snippet,
      };
    })
    .sort((a, b) => b.frequencyCount - a.frequencyCount || b.mandatoryCount - a.mandatoryCount);

  // 5. Rekomendasi prioritas belajar
  const learningRecommendations: LearningRecommendation[] = rankedSkills
    .filter((s) => s.cvStatus === "belum_ditemukan")
    .sort((a, b) => b.mandatoryCount - a.mandatoryCount || b.frequencyCount - a.frequencyCount)
    .slice(0, 3)
    .map((s) => ({
      skillName: s.skillName,
      demandPercentage: s.percentage,
      reason: `Diminta di ${s.frequencyCount} dari ${sampleSizeN} lowongan.`,
      priority: s.mandatoryCount > 0 ? "Tinggi" : "Sedang",
      action: "Pelajari",
    }));

  // Tanggal dataset pembaruan terakhir
  const latestRetrieved = allJobs.reduce((latest, j) => {
    if (!j.retrieved_at) return latest;
    const t = new Date(j.retrieved_at).getTime();
    return t > latest ? t : latest;
  }, 0);

  const lastUpdatedDate = latestRetrieved > 0
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(latestRetrieved))
    : "4 November 2026";

  return {
    sampleSizeN,
    lastUpdatedDate,
    topSkills: rankedSkills,
    learningRecommendations,
  };
}
