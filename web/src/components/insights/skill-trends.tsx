"use client";

import { CareerContextBar } from "@/components/career-context-bar";
import { useCareer } from "@/context/career-context";
import React, { useState } from "react";
import { FilterBar } from "@/components/ui/filter";
import { careerTargetFilter, getCategoryBySlug } from "@/lib/job-categories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterState } from "@/lib/job-filters";
import { MarketSkillBarChart } from "@/components/ui/chart";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { SkillTrendsBanner } from "@/components/insights/skill-trends-banner";
import { GuestCalloutBanner, GuestComparePrompt } from "@/components/insights/skill-trends-guest";
import { LearningButton, CHIP_BUTTON_CLASS } from "@/components/learning-button";
import Link from "next/link";
import { Check } from "lucide-react";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // ?bidang=<slug> (mis. dari Lowongan) menang atas target karier; slug tak dikenal diabaikan
  const urlBidang = getCategoryBySlug(searchParams.get("bidang"))?.slug ?? null;
  const [filters, setFiltersState] = useState<FilterState>({
    role: urlBidang ?? (isGuest ? "all" : careerTargetFilter(career.targetRole)),
    workType: "all",
    seniority: "all",
  });
  const [previousTarget, setPreviousTarget] = useState(career.targetRole);
  if (previousTarget !== career.targetRole) {
    setPreviousTarget(career.targetRole);
    // Target karier yang selesai dimuat/berganti tidak boleh menimpa bidang dari URL
    if (!isGuest && !urlBidang) setFiltersState(previous => ({ ...previous, role: careerTargetFilter(career.targetRole) }));
  }
  const [previousUrlBidang, setPreviousUrlBidang] = useState(urlBidang);
  if (previousUrlBidang !== urlBidang) {
    // Navigasi kembali/maju mengubah query: samakan filter dengan URL
    setPreviousUrlBidang(urlBidang);
    setFiltersState(previous => ({ ...previous, role: urlBidang ?? (isGuest ? "all" : careerTargetFilter(career.targetRole)) }));
  }
  const setFilters = (next: FilterState) => {
    setFiltersState(next);
    const params = new URLSearchParams(searchParams.toString());
    if (getCategoryBySlug(next.role)) params.set("bidang", next.role);
    else params.delete("bidang");
    const query = params.toString();
    setPreviousUrlBidang(getCategoryBySlug(next.role)?.slug ?? null);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const roleLabel = filters.role === "all" ? "Semua bidang" : getCategoryBySlug(filters.role)?.label ?? filters.role;
  const { sampleSizeN, lastUpdatedDate, topSkills, learningRecs, isLoading, errorMsg, refresh } =
    useSkillInsights(filters);
  const { notice, claimSkill } = useSkillActions({
    isGuest,
    role: filters.role,
    onSkillClaimed: refresh,
  });

  return (
    <div className="max-w-7xl mx-auto page-shell page-stack">
      <SkillTrendsBanner isGuest={isGuest} sampleSizeN={sampleSizeN} lastUpdatedDate={lastUpdatedDate} />

      {!isGuest && <CareerContextBar />}

      {errorMsg && <AlertBanner type="error" title="Gangguan Memuat Data" message={errorMsg} />}

      {notice && <AlertBanner type="success" title="Pembaruan Rencana Belajar" message={notice} />}

      {isGuest && <GuestCalloutBanner />}

      <div className="space-y-stack-md">
        <FilterBar filters={filters} onChange={setFilters} sampleCount={sampleSizeN} />
      </div>

      {isLoading ? (
        <div className="space-y-stack-xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : topSkills.length === 0 ? (
        <div className="py-stack-4xl">
          <EmptyState
            title="Tidak Ada Data Skill untuk Filter Ini"
            description="Coba sesuaikan filter bidang atau tipe kerja untuk melihat kebutuhan skill."
            actionLabel="Reset Filter"
            onAction={() => setFilters({ role: "all", workType: "all", seniority: "all" })}
          />
        </div>
      ) : (
        <div className="page-stack">
          <MarketSkillBarChart
            key={`${filters.role}-${filters.workType}-${filters.seniority}`}
            skills={topSkills.map((s) => ({
              skillName: s.skillName,
              count: s.frequencyCount,
              percentage: s.percentage,
              status: isGuest ? "missing" : CHART_STATUS[s.cvStatus],
              exampleRequirement: s.exampleRequirement,
            }))}
            totalSampleN={sampleSizeN}
            dataDate={lastUpdatedDate}
            roleFilterLabel={roleLabel}
            isLoggedIn={!isGuest && isAuthenticated}
            renderActions={isGuest ? undefined : (item) => {
              if (item.status === "missing") {
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => claimSkill(item.skillName)}
                      title="Tandai skill yang kamu kuasai tapi belum tertulis di CV"
                      className={`${CHIP_BUTTON_CLASS} bg-white text-sb-navy border-sb-border hover:border-sb-blue/40`}
                    >
                      <Check className="w-3 h-3 text-sb-text-2" />
                      Saya kuasai
                    </button>
                    <LearningButton skillName={item.skillName} size="chip" />
                  </>
                );
              }
              if (item.status === "needs_verification" || item.status === "user_added") {
                return (
                  <Link
                    href={`/cv?skill=${encodeURIComponent(item.skillName)}#review-skills`}
                    className="text-[11px] font-semibold text-sb-blue underline whitespace-nowrap"
                  >
                    Tinjau skill di CV
                  </Link>
                );
              }
              return null;
            }}
          />

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
