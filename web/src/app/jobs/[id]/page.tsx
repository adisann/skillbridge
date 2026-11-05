import { Suspense } from "react";
import JobDetailClient from "./job-detail-client";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
          Memuat rincian lowongan kerja...
        </div>
      }
    >
      <JobDetailClient params={params} />
    </Suspense>
  );
}
