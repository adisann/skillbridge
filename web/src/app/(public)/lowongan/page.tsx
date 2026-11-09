import type { Metadata } from "next";
import { JobExplorer } from "@/components/jobs/job-explorer";
import { getCachedPublicJobs } from "@/lib/public-jobs";
import { formatJobListItem } from "@/lib/job-list-format";
import type { JobListItem } from "@/types/job";
import type { MatchCategory } from "@/lib/matching";

export const metadata: Metadata = {
  title: "Lowongan Kerja Aktif | SkillBridge",
  description:
    "Eksplorasi lowongan kerja terverifikasi dari berbagai bidang dan industri terkemuka.",
};

/** Hanya field yang dipakai kartu, panel pratinjau, dan filter tamu; menjaga HTML awal tetap kecil. */
function toGuestListItem(job: ReturnType<typeof formatJobListItem>): JobListItem {
  return {
    id: job.id,
    externalId: job.externalId ?? "",
    title: job.title,
    canonicalTitle: job.canonicalTitle,
    category: job.category,
    categoryLabel: job.categoryLabel,
    company: job.company,
    location: job.location,
    employmentType: job.employmentType,
    seniority: job.seniority,
    experienceYearsMin: job.experienceYearsMin,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    minGpa: job.minGpa,
    sourceName: job.sourceName,
    sourceUrl: job.sourceUrl,
    retrievalMethod: job.retrievalMethod,
    retrievedAt: job.retrievedAt,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    matchScore: null,
    matchStatus: job.matchStatus as MatchCategory,
    matchedSkills: [],
    missingSkills: [],
    factorsSupporting: [],
    factorsLimiting: [],
  };
}

export default async function PublicLowonganPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Membaca searchParams membuat halaman dirender di server per request: daftar lowongan
  // langsung ada di HTML, tanpa menunggu /api/jobs dan tanpa skeleton yang menggeser footer.
  // Karena itu juga tidak perlu <Suspense> di sini (useSearchParams tidak bail out di render dinamis).
  await searchParams;
  const initialJobs = (await getCachedPublicJobs()).map((job) => toGuestListItem(formatJobListItem(job)));

  return <JobExplorer mode="guest" initialJobs={initialJobs} />;
}
