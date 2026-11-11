import { Suspense } from "react";
import { JobExplorer } from "@/components/jobs/job-explorer";
import { SkeletonCard } from "@/components/ui/loading";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto page-shell page-stack">
          <SkeletonCard />
        </div>
      }
    >
      <JobExplorer mode="user" />
    </Suspense>
  );
}
