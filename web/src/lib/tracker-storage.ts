"use client";

import { TrackedJob, JobStage } from "@/types/tracker";

const BASE_STORAGE_KEY = "skillbridge_job_tracker_v2";

function getStorageKey(userId?: string): string {
  if (userId) {
    return `${BASE_STORAGE_KEY}_${userId}`;
  }
  return BASE_STORAGE_KEY;
}

export interface ServerSavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType?: string;
  seniority?: string;
  sourceName?: string;
  sourceUrl?: string;
  matchScore?: number;
  matchStatus?: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills?: string[];
  missingSkills?: string[];
}

/**
 * Membaca data pelacakan lokal dari localStorage (terisolasi per userId)
 */
function getLocalTrackerMap(userId?: string): Record<string, Partial<TrackedJob>> {
  if (typeof window === "undefined") return {};
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("[TrackerStorage] Gagal membaca localStorage:", err);
    return {};
  }
}

/**
 * Menyimpan seluruh map pelacakan ke localStorage (terisolasi per userId)
 */
function saveLocalTrackerMap(map: Record<string, Partial<TrackedJob>>, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(map));
  } catch (err) {
    console.warn("[TrackerStorage] Gagal menyimpan ke localStorage:", err);
  }
}

/**
 * Menggabungkan daftar lowongan tersimpan dari server dengan status tracking lokal
 */
export function mergeServerAndLocalJobs(serverJobs: ServerSavedJob[], userId?: string): TrackedJob[] {
  const localMap = getLocalTrackerMap(userId);
  const today = new Date().toISOString().split("T")[0];

  const mergedServerJobs: TrackedJob[] = serverJobs.map((sj) => {
    const local = localMap[sj.id] || {};
    return {
      id: sj.id,
      title: sj.title,
      company: sj.company,
      location: sj.location || "Indonesia (Hybrid)",
      employmentType: sj.employmentType || "Full-time",
      seniority: sj.seniority || "Junior",
      sourceName: sj.sourceName || "Internal",
      sourceUrl: sj.sourceUrl,
      matchScore: sj.matchScore ?? 80,
      matchStatus: sj.matchStatus || "match",
      matchedSkills: sj.matchedSkills || ["SQL", "Excel"],
      missingSkills: sj.missingSkills || [],
      stage: (local.stage as JobStage) || "bookmarked",
      priority: typeof local.priority === "number" ? local.priority : 4,
      salaryExpectation: local.salaryExpectation || "Kompensasi Kompetitif",
      dateSaved: local.dateSaved || today,
      dateApplied: local.dateApplied,
      interviewDate: local.interviewDate,
      notes: local.notes || "",
    };
  });

  // Tambahkan juga custom jobs yang ditambahkan user sendiri secara lokal yang tidak ada di server
  const serverIds = new Set(serverJobs.map((j) => j.id));
  const customJobs: TrackedJob[] = [];

  for (const [id, item] of Object.entries(localMap)) {
    if (!serverIds.has(id) && item.title && item.company) {
      customJobs.push({
        id,
        title: item.title,
        company: item.company,
        location: item.location || "Indonesia",
        employmentType: item.employmentType || "Full-time",
        seniority: item.seniority || "Mid",
        sourceName: item.sourceName || "Manual Target",
        sourceUrl: item.sourceUrl,
        matchScore: item.matchScore ?? 85,
        matchStatus: item.matchStatus || "match",
        matchedSkills: item.matchedSkills || ["SQL", "Python"],
        missingSkills: item.missingSkills || [],
        stage: item.stage || "bookmarked",
        priority: item.priority ?? 3,
        salaryExpectation: item.salaryExpectation || "",
        dateSaved: item.dateSaved || today,
        dateApplied: item.dateApplied,
        interviewDate: item.interviewDate,
        notes: item.notes || "",
      });
    }
  }

  return [...mergedServerJobs, ...customJobs];
}

/**
 * Memperbarui stage lowongan (misal: pindah ke 'applied' atau 'interviewing')
 */
export function updateTrackedJobStage(jobId: string, stage: JobStage, userId?: string): void {
  const map = getLocalTrackerMap(userId);
  const existing = map[jobId] || {};
  const today = new Date().toISOString().split("T")[0];

  const updated: Partial<TrackedJob> = {
    ...existing,
    stage,
  };

  if (stage === "applied" && !existing.dateApplied) {
    updated.dateApplied = today;
  }

  map[jobId] = updated;
  saveLocalTrackerMap(map, userId);
}

/**
 * Memperbarui prioritas / rating bintang (1-5)
 */
export function updateTrackedJobPriority(jobId: string, priority: number, userId?: string): void {
  const map = getLocalTrackerMap(userId);
  const existing = map[jobId] || {};
  map[jobId] = {
    ...existing,
    priority: Math.max(1, Math.min(5, priority)),
  };
  saveLocalTrackerMap(map, userId);
}

/**
 * Menyimpan catatan / rincian pekerjaan
 */
export function updateTrackedJobDetails(
  jobId: string,
  details: {
    stage?: JobStage;
    priority?: number;
    salaryExpectation?: string;
    dateApplied?: string;
    interviewDate?: string;
    notes?: string;
  },
  userId?: string
): void {
  const map = getLocalTrackerMap(userId);
  map[jobId] = {
    ...(map[jobId] || {}),
    ...details,
  };
  saveLocalTrackerMap(map, userId);
}

/**
 * Menambahkan lowongan custom baru ke tracker
 */
export function addCustomTrackedJob(job: TrackedJob, userId?: string): void {
  const map = getLocalTrackerMap(userId);
  map[job.id] = job;
  saveLocalTrackerMap(map, userId);
}

/**
 * Menghapus lowongan dari tracker lokal
 */
export function removeTrackedJobFromStorage(jobId: string, userId?: string): void {
  const map = getLocalTrackerMap(userId);
  delete map[jobId];
  saveLocalTrackerMap(map, userId);
}

