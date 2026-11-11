import { useCallback, useEffect, useState } from "react";
import type { AdminJob, AdminNotification, AdminTab, JobSourceItem, SkillItem, WorkerRunRecord } from "@/types/admin";

async function fetchAdminData<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (response.status === 401) throw new Error("Sesi berakhir. Masuk kembali untuk memuat data.");
  if (response.status === 403) throw new Error("Akun ini tidak memiliki izin administrator.");
  if (!response.ok) throw new Error(`Server mengembalikan HTTP ${response.status}. Coba muat ulang.`);
  return response.json() as Promise<T>;
}

/** Data katalog admin (lowongan, riwayat worker, taksonomi skill) beserta notifikasi status. */
export function useAdminData() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [runs, setRuns] = useState<WorkerRunRecord[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [sources, setSources] = useState<JobSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<Partial<Record<AdminTab, string>>>({});
  const [notification, setNotification] = useState<AdminNotification | null>(null);

  const refetch = useCallback(async () => {
    const [jobResult, skillResult, runResult] = await Promise.allSettled([
      fetchAdminData<{ jobs: AdminJob[] }>("/api/admin/jobs"),
      fetchAdminData<{ skills: SkillItem[]; sources: JobSourceItem[] }>("/api/admin/skills"),
      fetchAdminData<{ runs: WorkerRunRecord[] }>("/api/admin/worker-runs"),
    ]);
    if (jobResult.status === "fulfilled") setJobs(jobResult.value.jobs);
    if (runResult.status === "fulfilled") setRuns(runResult.value.runs);
    if (skillResult.status === "fulfilled") {
      setSkills(skillResult.value.skills);
      setSources(skillResult.value.sources);
    }
    const errors: Partial<Record<AdminTab, string>> = {};
    const sections = { jobs: jobResult, skills: skillResult, runs: runResult } as const;
    for (const tab of ["jobs", "skills", "runs"] as const) {
      const result = sections[tab];
      if (result.status === "rejected") errors[tab] = (result.reason as Error).message;
    }
    setLoadErrors(errors);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Ditunda satu tick agar setState tidak terjadi sinkron di badan effect.
    const timer = setTimeout(refetch, 0);
    return () => clearTimeout(timer);
  }, [refetch]);

  return { jobs, runs, skills, sources, isLoading, loadErrors, notification, setNotification, refetch };
}
