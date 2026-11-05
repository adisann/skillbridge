import { Suspense } from "react";
import { JobExplorer } from "@/components/jobs/job-explorer";
import { SkeletonCard } from "@/components/ui/loading";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-8 space-y-4">
          <SkeletonCard />
        </div>
      }
    >
      <JobExplorer mode="user" />
    </Suspense>
  );
}
