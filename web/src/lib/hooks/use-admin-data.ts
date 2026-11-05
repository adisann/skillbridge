import { useCallback, useEffect, useState } from "react";
import type { AdminJob, AdminNotification, JobSourceItem, SkillItem, WorkerRunRecord } from "@/types/admin";

async function fetchAdminData() {
  const [jobsRes, runsRes, skillsRes] = await Promise.all([
    fetch("/api/jobs"),
    fetch("/api/admin/worker-runs"),
    fetch("/api/admin/skills"),
  ]);
  const [jobsData, runsData, skillsData] = await Promise.all([jobsRes.json(), runsRes.json(), skillsRes.json()]);
  return { jobsData, runsData, skillsData };
}

/** Data katalog admin (lowongan, riwayat worker, taksonomi skill) beserta notifikasi status. */
export function useAdminData() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [runs, setRuns] = useState<WorkerRunRecord[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [sources, setSources] = useState<JobSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<AdminNotification | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { jobsData, runsData, skillsData } = await fetchAdminData();
      if (jobsData.jobs) setJobs(jobsData.jobs);
      if (runsData.runs) setRuns(runsData.runs);
      if (skillsData.skills) setSkills(skillsData.skills);
      if (skillsData.sources) setSources(skillsData.sources);
    } catch {
      setNotification({ type: "error", message: "Gagal memuat data dari database Supabase." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ditunda satu tick agar setState tidak terjadi sinkron di badan effect.
    const timer = setTimeout(refetch, 0);
    return () => clearTimeout(timer);
  }, [refetch]);

  return { jobs, runs, skills, sources, isLoading, notification, setNotification, refetch };
}
