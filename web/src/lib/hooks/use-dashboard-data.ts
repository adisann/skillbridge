import { careerTargetFilter } from "@/lib/job-categories";
import { useEffect, useState } from "react";
import { fetchDeduped } from "@/lib/fetcher";
import { mergeServerAndLocalJobs, type ServerSavedJob } from "@/lib/tracker-storage";
import type { DashboardJob, DashboardRecommendation, MarketSkill } from "@/lib/dashboard";
import type { TrackedJob } from "@/types/tracker";

const TOP_MARKET_SKILLS_SHOWN = 3;

interface InsightsPayload {
  sampleSizeN: number;
  topSkills: MarketSkill[];
  learningRecommendations: DashboardRecommendation[];
}

/** Data ringkasan dashboard: lowongan, insight pasar, CV aktif, dan lamaran tersimpan. */
export function useDashboardData(userId?: string, targetRole?: string) {
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  const [topMarketSkills, setTopMarketSkills] = useState<MarketSkill[]>([]);
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [hasCv, setHasCv] = useState(false);
  const [recommendations, setRecommendations] = useState<DashboardRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (targetRole) queryParams.append("role", careerTargetFilter(targetRole));

        const [jobsData, insightsData, savedData, cvData] = await Promise.all([
          fetchDeduped<{ jobs: DashboardJob[]; total: number }>(`/api/jobs?${queryParams.toString()}`),
          fetchDeduped<InsightsPayload>(`/api/insights?${queryParams.toString()}`),
          fetchDeduped<{ savedJobs?: ServerSavedJob[] }>(`/api/saved-jobs`),
          fetchDeduped<{ resume?: { skills: string[] } }>(`/api/cv/save`),
        ]);

        const resumeSkills = cvData.resume?.skills ?? [];
        setCvSkills(resumeSkills);
        setHasCv(resumeSkills.length > 0);

        if (jobsData.jobs) {
          setJobs(jobsData.jobs);
          setTotalJobsCount(insightsData.sampleSizeN ?? jobsData.total ?? jobsData.jobs.length);
        }

        if (insightsData.topSkills) {
          setTopMarketSkills(insightsData.topSkills.slice(0, TOP_MARKET_SKILLS_SHOWN));
        }

        if (insightsData.learningRecommendations) {
          setRecommendations(insightsData.learningRecommendations);
        }

        setTrackedJobs(mergeServerAndLocalJobs(savedData.savedJobs || [], userId));
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, targetRole]);

  return { jobs, trackedJobs, totalJobsCount, topMarketSkills, cvSkills, hasCv, recommendations, isLoading };
}
