import { Suspense } from "react";
import { SkillTrends } from "@/components/insights/skill-trends";
import { SkeletonCard } from "@/components/ui/loading";

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto page-shell page-stack">
          <SkeletonCard />
        </div>
      }
    >
      <SkillTrends mode="user" />
    </Suspense>
  );
}
