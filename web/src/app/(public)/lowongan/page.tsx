import { Suspense } from "react";
import type { Metadata } from "next";
import { JobExplorer } from "@/components/jobs/job-explorer";
import { SkeletonCard } from "@/components/ui/loading";
import { getCachedPublicJobs } from "@/lib/public-jobs";
import { formatJobListItem } from "@/lib/job-list-format";
import type { JobListItem } from "@/types/job";

export const metadata: Metadata = {
  title: "Lowongan Kerja Aktif | SkillBridge",
  description:
    "Eksplorasi lowongan kerja terverifikasi dari berbagai bidang dan industri terkemuka.",
};

export default async function PublicLowonganPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Membaca searchParams membuat halaman dirender di server per request, sehingga daftar
  // lowongan langsung ada di HTML (tidak menunggu /api/jobs dan tidak ada skeleton yang bergeser).
  await searchParams;
  const initialJobs = (await getCachedPublicJobs()).map((job) => formatJobListItem(job)) as JobListItem[];

  return (
    <Suspense
      fallback={
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-8 space-y-4">
          <SkeletonCard />
        </div>
      }
    >
      <JobExplorer mode="guest" initialJobs={initialJobs} />
    </Suspense>
  );
}
