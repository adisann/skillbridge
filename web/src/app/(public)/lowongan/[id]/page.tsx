import { Suspense, use } from "react";
import type { Metadata } from "next";
import { JobDetail } from "@/components/jobs/job-detail";

export const metadata: Metadata = {
  title: "Detail Lowongan Kerja | SkillBridge",
  description:
    "Rincian kualifikasi dan persyaratan lowongan kerja terverifikasi.",
};

function JobDetailWrapper({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  return <JobDetail jobId={resolved.id} mode="guest" />;
}

export default function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-sb-text-2">
          Memuat rincian lowongan kerja...
        </div>
      }
    >
      <JobDetailWrapper params={params} />
    </Suspense>
  );
}

