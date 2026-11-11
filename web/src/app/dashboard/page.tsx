"use client";

import { CareerContextBar } from "@/components/career-context-bar";
import { useMemo } from "react";
import { SkeletonCard } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { DashboardBanner } from "@/components/dashboard/dashboard-banner";
import { CvSkillsCard } from "@/components/dashboard/cv-skills-card";
import { MarketSkillsCard } from "@/components/dashboard/market-skills-card";
import { ApplicationStagesCard } from "@/components/dashboard/application-stages-card";
import { RecommendedJobsCard } from "@/components/dashboard/recommended-jobs-card";
import { MissingSkillsCard } from "@/components/dashboard/missing-skills-card";
import { useAuth } from "@/lib/supabase/auth-context";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { countJobsByStage, findMissingTargetSkills, rankRecommendedJobs } from "@/lib/dashboard";

const PRIORITY_THRESHOLD = 4;
const PRIORITY_JOBS_SHOWN = 3;

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { jobs, trackedJobs, totalJobsCount, topMarketSkills, cvSkills, hasCv, recommendations, isLoading } =
    useDashboardData(user?.id, user?.targetRole);

  const stageCounts = useMemo(() => countJobsByStage(trackedJobs), [trackedJobs]);

  const priorityJobs = useMemo(
    () => trackedJobs.filter((j) => (j.priority || 0) >= PRIORITY_THRESHOLD).slice(0, PRIORITY_JOBS_SHOWN),
    [trackedJobs]
  );

  const recommendedJobs = useMemo(() => rankRecommendedJobs(jobs, user?.targetRole), [jobs, user?.targetRole]);

  const missingSkills = useMemo(
    () => findMissingTargetSkills({ cvSkills, rankedJobs: recommendedJobs, allJobs: jobs, recommendations }),
    [cvSkills, recommendedJobs, jobs, recommendations]
  );

  return (
    <div className="max-w-7xl mx-auto page-shell page-stack">
      <CareerContextBar />
      <DashboardBanner fullName={user?.fullName} targetRole={user?.targetRole} />

      {isLoading ? (
        <div className="space-y-stack-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          <CvSkillsCard cvSkills={cvSkills} targetRole={user?.targetRole} />
          <MarketSkillsCard
            totalJobsCount={totalJobsCount}
            topMarketSkills={topMarketSkills}
            targetRole={user?.targetRole}
          />
          <ApplicationStagesCard stageCounts={stageCounts} totalTracked={trackedJobs.length} />
          <RecommendedJobsCard jobs={recommendedJobs} wide={!hasCv} />
          {hasCv && <MissingSkillsCard missingSkills={missingSkills} priorityJobs={priorityJobs} />}
        </div>
      )}
    </div>
  );
}
