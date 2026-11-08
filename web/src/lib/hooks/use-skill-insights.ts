import { useEffect, useState } from "react";
import { fetchDeduped, clearDedupedCache } from "@/lib/fetcher";
import type { FilterState } from "@/lib/job-filters";
import type { InsightsResponse, LearningRec, TopSkillInsight } from "@/types/insights";

const DEFAULT_UPDATED_DATE = "Belum tersedia";

function buildInsightsQuery(filters: FilterState): string {
  const params = new URLSearchParams();
  params.append("role", filters.role);
  if (filters.workType && filters.workType !== "all") params.append("workType", filters.workType);
  if (filters.seniority && filters.seniority !== "all") params.append("seniority", filters.seniority);
  if (filters.location && filters.location !== "all") params.append("location", filters.location);
  if (filters.postedDate && filters.postedDate !== "all") params.append("postedDate", filters.postedDate);
  return params.toString();
}

/** Memuat insight skill pasar sesuai filter; `refresh` memuat ulang dengan filter yang sama. */
export function useSkillInsights(filters: FilterState) {
  const [sampleSizeN, setSampleSizeN] = useState<number>(0);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>(DEFAULT_UPDATED_DATE);
  const [topSkills, setTopSkills] = useState<TopSkillInsight[]>([]);
  const [learningRecs, setLearningRecs] = useState<LearningRec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const query = buildInsightsQuery(filters);

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      setIsLoading(true); setTopSkills([]); setLearningRecs([]); setSampleSizeN(0);
      try {
        const data = await fetchDeduped<InsightsResponse>(`/api/insights?${query}`);

        if (isMounted) {
          setSampleSizeN(typeof data.sampleSizeN === "number" ? data.sampleSizeN : 0);
          setLastUpdatedDate(data.lastUpdated || DEFAULT_UPDATED_DATE);
          setTopSkills(data.topSkills || []);
          setLearningRecs(data.learningRecommendations || []);
          setErrorMsg(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const error = err as Error;
          setErrorMsg(error.message || "Gagal memuat insight");
          setIsLoading(false);
        }
      }
    };

    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [query, refreshTrigger]);

  return {
    sampleSizeN,
    lastUpdatedDate,
    topSkills,
    learningRecs,
    isLoading,
    errorMsg,
    refresh: () => (clearDedupedCache("/api/insights"), setRefreshTrigger((prev) => prev + 1)),
  };
}
