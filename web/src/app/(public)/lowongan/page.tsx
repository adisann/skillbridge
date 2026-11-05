import { Suspense } from "react";
import type { Metadata } from "next";
import { JobExplorer } from "@/components/jobs/job-explorer";
import { SkeletonCard } from "@/components/ui/loading";

export const metadata: Metadata = {
  title: "Lowongan Kerja Aktif | SkillBridge",
  description:
    "Eksplorasi lowongan kerja terverifikasi dari berbagai bidang dan industri terkemuka.",
};

export default function PublicLowonganPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-8 space-y-4">
          <SkeletonCard />
        </div>
      }
    >
      <JobExplorer mode="guest" />
    </Suspense>
  );
}

