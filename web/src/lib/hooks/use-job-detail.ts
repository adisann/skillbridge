import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchDeduped } from "@/lib/fetcher";
import type { JobDetailData } from "@/types/job";

/** Memuat rincian lowongan, status tersimpan, dan aksi simpan/batal simpan. */
export function useJobDetail(jobId: string, isGuest: boolean) {
  const router = useRouter();
  const [job, setJob] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const fetches: [Promise<{ job?: JobDetailData }>, Promise<{ savedJobs?: Array<{ id: string }> }>] = [
          fetchDeduped<{ job?: JobDetailData }>(`/api/jobs/${jobId}`),
          !isGuest
            ? fetchDeduped<{ savedJobs?: Array<{ id: string }> }>("/api/saved-jobs").catch(() => ({ savedJobs: [] }))
            : Promise.resolve({ savedJobs: [] }),
        ];

        const [jobRes, savedRes] = await Promise.all(fetches);

        if (jobRes.job) {
          setJob(jobRes.job);
        } else {
          setErrorMsg("Data lowongan tidak ditemukan.");
        }

        if (savedRes.savedJobs && savedRes.savedJobs.some((s) => s.id === jobId)) {
          setIsSaved(true);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "Gagal memuat rincian lowongan.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [jobId, isGuest]);

  const toggleSave = async () => {
    if (isGuest) {
      router.push(`/login?next=${encodeURIComponent(`/lowongan/${jobId}`)}`);
      return;
    }

    const previous = isSaved;
    setIsSaved(!previous);
    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
    } catch {
      setIsSaved(previous);
    }
  };

  return { job, isLoading, isSaved, errorMsg, toggleSave };
}
