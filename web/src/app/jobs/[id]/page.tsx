import { Suspense, use } from "react";
import { JobDetail } from "@/components/jobs/job-detail";

function JobDetailWrapper({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  return <JobDetail jobId={resolved.id} mode="user" />;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-stack-md py-stack-5xl text-center text-sm text-sb-text-2">
          Memuat rincian lowongan kerja...
        </div>
      }
    >
      <JobDetailWrapper params={params} />
    </Suspense>
  );
}
