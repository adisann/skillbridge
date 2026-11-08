"use client";

import { CareerContextBar } from "@/components/career-context-bar";
import { useCareer } from "@/context/career-context";
import React, { useState } from "react";
import { FilterBar } from "@/components/ui/filter";
import { careerTargetFilter } from "@/lib/job-categories";
import type { FilterState } from "@/lib/job-filters";
import { MarketSkillBarChart } from "@/components/ui/chart";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { SkillTrendsBanner } from "@/components/insights/skill-trends-banner";
import { GuestCalloutBanner, GuestComparePrompt } from "@/components/insights/skill-trends-guest";
import { SkillComparisonCard } from "@/components/insights/skill-comparison-card";
import { LearningRecommendations } from "@/components/insights/learning-recommendations";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSkillInsights } from "@/lib/hooks/use-skill-insights";
import { useSkillActions } from "@/lib/hooks/use-skill-actions";
import type { TopSkillInsight } from "@/types/insights";

interface SkillTrendsProps {
  mode?: "guest" | "user";
}

const CHART_STATUS: Record<TopSkillInsight["cvStatus"], "found" | "needs_verification" | "missing" | "user_added"> = {
  tercantum: "found",
  perlu_verifikasi: "needs_verification",
  ditambahkan_pengguna: "user_added",
  belum_ditemukan: "missing",
};

export function SkillTrends({ mode = "user" }: SkillTrendsProps) {
  const isGuest = mode === "guest";
  const { isAuthenticated } = useAuth();

  const career = useCareer();
  const [filters, setFilters] = useState<FilterState>({
    role: isGuest ? "all" : careerTargetFilter(career.targetRole),
    workType: "all",
    seniority: "all",
  });
  const { sampleSizeN, lastUpdatedDate, topSkills, learningRecs, isLoading, errorMsg, refresh } =
    useSkillInsights(filters);
  const { notice, claimSkill } = useSkillActions({
    isGuest,
    role: filters.role,
    onSkillClaimed: refresh,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SkillTrendsBanner isGuest={isGuest} sampleSizeN={sampleSizeN} lastUpdatedDate={lastUpdatedDate} />

      {!isGuest && <CareerContextBar />}

      {errorMsg && <AlertBanner type="error" title="Gangguan Memuat Data" message={errorMsg} />}

      {notice && <AlertBanner type="success" title="Pembaruan Rencana Belajar" message={notice} />}

      {isGuest && <GuestCalloutBanner />}

      <div className="space-y-4">
        <FilterBar filters={filters} onChange={setFilters} sampleCount={sampleSizeN} />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : topSkills.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Tidak Ada Data Skill untuk Filter Ini"
            description="Coba sesuaikan filter bidang atau tipe kerja untuk melihat kebutuhan skill."
            actionLabel="Reset Filter"
            onAction={() => setFilters({ role: "all", workType: "all", seniority: "all" })}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <MarketSkillBarChart
            skills={topSkills.map((s) => ({
              skillName: s.skillName,
              count: s.frequencyCount,
              percentage: s.percentage,
              status: isGuest ? "missing" : CHART_STATUS[s.cvStatus],
              exampleRequirement: s.exampleRequirement,
            }))}
            totalSampleN={sampleSizeN}
            dataDate={lastUpdatedDate}
            roleFilterLabel={filters.role === "all" ? "Seluruh Posisi" : filters.role}
            isLoggedIn={!isGuest && isAuthenticated}
          />

          <details className="rounded-2xl border border-sb-border bg-white/60 p-4">
            <summary className="cursor-pointer font-semibold text-sb-navy">Tinjau skill & tambahkan target belajar</summary>
            <div className="mt-4"><SkillComparisonCard
            skills={topSkills}
            isGuest={isGuest}
            sampleSizeN={sampleSizeN}
            onClaim={claimSkill}
          /></div></details>

          {isGuest && (
            <GuestComparePrompt />
          )}

          {!isGuest && learningRecs.length > 0 && (
            <LearningRecommendations
              recommendations={learningRecs}
            />
          )}
        </div>
      )}
    </div>
  );
}
