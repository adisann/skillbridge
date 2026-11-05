import { Suspense } from "react";
import { SkillTrends } from "@/components/insights/skill-trends";
import { SkeletonCard } from "@/components/ui/loading";

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <SkeletonCard />
        </div>
      }
    >
      <SkillTrends mode="user" />
    </Suspense>
  );
}
