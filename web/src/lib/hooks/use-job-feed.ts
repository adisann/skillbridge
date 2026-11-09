import { useEffect, useState } from "react";
import { fetchDeduped } from "@/lib/fetcher";
import type { JobListItem } from "@/types/job";

interface UseJobFeedOptions {
  role: string;
  search: string;
  userId?: string;
  isGuest: boolean;
}

/** Memuat daftar lowongan beserta lowongan tersimpan, dan menjaga lowongan yang sedang dipilih. */
export function useJobFeed({ role, search, userId, isGuest }: UseJobFeedOptions) {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [referenceTime, setReferenceTime] = useState<number>(0);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const queryParams = new URLSearchParams();
        if (role !== "all") queryParams.append("bidang", role);
        if (search.trim()) queryParams.append("q", search.trim());

        const fetches: [Promise<{ jobs: JobListItem[] }>, Promise<{ savedJobIds?: string[] }>] = [
          fetchDeduped<{ jobs: JobListItem[] }>(`/api/jobs?${queryParams.toString()}`),
          !isGuest
            ? fetchDeduped<{ savedJobIds?: string[] }>("/api/saved-jobs").catch(() => ({ savedJobIds: [] }))
            : Promise.resolve({ savedJobIds: [] }),
        ];

        const [data, savedData] = await Promise.all(fetches);

        const fetchedJobs = data.jobs || [];
        setJobs(fetchedJobs);
        setReferenceTime(Date.now());
        if (savedData.savedJobIds) setSavedJobIds(savedData.savedJobIds);

        // Pilih lowongan pertama sebagai default
        if (!isGuest && fetchedJobs.length > 0) {
          setSelectedJobId((current) => current || fetchedJobs[0].id);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "Gagal memuat lowongan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [role, search, userId, isGuest]);

  return {
    jobs,
    isLoading,
    errorMsg,
    referenceTime,
    savedJobIds,
    setSavedJobIds,
    selectedJobId,
    setSelectedJobId,
  };
}
