"use client";

import { confirmAction, showNotice } from "@/lib/dialogs";

import React, { useState, useEffect, useMemo, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Bookmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/lib/supabase/auth-context";
import { TrackedJob, JobStage } from "@/types/tracker";
import {
  mergeServerAndLocalJobs,
  updateTrackedJobStage,
  updateTrackedJobPriority,
  updateTrackedJobDetails,
  removeTrackedJobFromStorage,
  addCustomTrackedJob,
  ServerSavedJob,
} from "@/lib/tracker-storage";
import { JobComparisonModal } from "@/components/tracker/job-comparison-modal";
import { TrackerHeader } from "@/components/tracker/tracker-header";
import { TrackerTable } from "@/components/tracker/tracker-table";
import { TrackerBoard } from "@/components/tracker/tracker-board";
import { EditJobModal, AddJobModal } from "@/components/tracker/tracker-modals";
import { fetchDeduped } from "@/lib/fetcher";

export default function TrackerPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto p-8">
            <div className="h-64 rounded-2xl bg-white border border-sb-border animate-pulse" />
          </div>
        }
      >
        <TrackerContent />
      </Suspense>
    </ProtectedRoute>
  );
}

interface CatalogJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType?: string;
  sourceName?: string;
  matchScore?: number | null;
  matchStatus?: TrackedJob["matchStatus"];
  matchedSkills?: string[];
  missingSkills?: string[];
}

function TrackerContent() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [catalogJobs, setCatalogJobs] = useState<CatalogJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [activeStageFilter, setActiveStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [sortBy, setSortBy] = useState<"priority" | "match" | "date">("priority");

  // Router & URL query pagination states
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updatePaginationUrl = (newPage: number, newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(newSize));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Selection for comparison
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Edit / Add Modal states
  const [editingJob, setEditingJob] = useState<TrackedJob | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 1. Muat lowongan tersimpan dari API server & gabungkan dengan data pelacakan lokal
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [savedData, catalogData] = await Promise.all([
          fetchDeduped<{ savedJobs?: ServerSavedJob[] }>("/api/saved-jobs").catch(() => ({ savedJobs: [] as ServerSavedJob[] })),
          fetchDeduped<{ jobs?: CatalogJob[] }>("/api/jobs").catch(() => ({ jobs: [] })),
        ]);

        if (!isMounted) return;

        if (catalogData.jobs) {
          setCatalogJobs(
            catalogData.jobs.map(
              (j: CatalogJob) => ({
                id: j.id,
                title: j.title,
                company: j.company,
                location: j.location,
                employmentType: j.employmentType,
                sourceName: j.sourceName,
                matchScore: j.matchScore,
                matchStatus: j.matchStatus,
                matchedSkills: j.matchedSkills,
                missingSkills: j.missingSkills,
              })
            )
          );
        }

        const serverSaved = savedData.savedJobs || [];
        const merged = mergeServerAndLocalJobs(serverSaved, user?.id);
        setJobs(merged);
      } catch (err) {
        console.error("[Tracker] Gagal memuat data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Stage counters
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: jobs.length,
      bookmarked: 0,
      applying: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const j of jobs) {
      if (counts[j.stage] !== undefined) {
        counts[j.stage]++;
      }
    }
    return counts;
  }, [jobs]);

  // Filtered & Sorted Jobs
  const displayedJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        if (activeStageFilter !== "all" && j.stage !== activeStageFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = j.title.toLowerCase().includes(q);
          const matchCompany = j.company.toLowerCase().includes(q);
          const matchLoc = j.location.toLowerCase().includes(q);
          if (!matchTitle && !matchCompany && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") return b.priority - a.priority;
        if (sortBy === "match") return b.matchScore - a.matchScore;
        return new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime();
      });
  }, [jobs, activeStageFilter, searchQuery, sortBy]);

  // Derive page & pageSize directly from URL query params
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawPageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const pageSize = [10, 20, 50].includes(rawPageSize) ? rawPageSize : 10;
  const totalPages = Math.max(1, Math.ceil(displayedJobs.length / pageSize));
  const currentPage = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      updatePaginationUrl(newPage, pageSize);
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    startTransition(() => {
      updatePaginationUrl(1, newSize);
    });
  };

  // Paginated slice for current page
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedJobs.slice(start, start + pageSize);
  }, [displayedJobs, currentPage, pageSize]);

  // Handlers for job operations
  const handleStageChange = (jobId: string, newStage: JobStage) => {
    updateTrackedJobStage(jobId, newStage, user?.id);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              stage: newStage,
              dateApplied:
                newStage === "applied" ? j.dateApplied || new Date().toISOString().split("T")[0] : j.dateApplied,
            }
          : j
      )
    );
  };

  const handlePriorityChange = (jobId: string, newPriority: number) => {
    updateTrackedJobPriority(jobId, newPriority, user?.id);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, priority: newPriority } : j)));
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!await confirmAction("Hapus lowongan ini dari pelacakan dan daftar simpanan?")) return;

    removeTrackedJobFromStorage(jobId, user?.id);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });

    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
    } catch (e) {
      console.warn("Gagal menghapus bookmark server:", e);
    }
  };

  const toggleSelectJob = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else {
        if (next.size >= 4) {
          void showNotice("Maksimal dapat membandingkan 4 lowongan sekaligus.");
          return prev;
        }
        next.add(jobId);
      }
      return next;
    });
  };

  const toggleCompareMode = () => {
    setCompareMode((on) => {
      if (on) setSelectedJobIds(new Set());
      else setViewMode("table"); // pilih lowongan dilakukan di tampilan tabel
      return !on;
    });
  };

  const comparisonJobs = useMemo(() => {
    return jobs.filter((j) => selectedJobIds.has(j.id));
  }, [jobs, selectedJobIds]);

  const handleSaveEdit = (updated: TrackedJob) => {
    updateTrackedJobDetails(
      updated.id,
      {
        stage: updated.stage,
        priority: updated.priority,
        salaryExpectation: updated.salaryExpectation,
        dateApplied: updated.dateApplied,
        interviewDate: updated.interviewDate,
        notes: updated.notes,
      },
      user?.id
    );

    setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...updated } : j)));
    setEditingJob(null);
  };

  const handleAddCatalogJob = async (
    catalogJobId: string,
    stage: JobStage,
    priority: number,
    salary: string
  ) => {
    const catJob = catalogJobs.find((c) => c.id === catalogJobId);
    if (!catJob) return;

    const today = new Date().toISOString().split("T")[0];
    const newTracked: TrackedJob = {
      id: catJob.id,
      title: catJob.title,
      company: catJob.company,
      location: catJob.location,
      employmentType: catJob.employmentType || "",
      sourceName: catJob.sourceName || "",
      // Kecocokan diambil dari hasil analisis CV untuk lowongan ini, bukan angka bawaan
      matchScore: catJob.matchScore ?? 0,
      matchStatus: catJob.matchScore != null ? (catJob.matchStatus ?? "insufficient_evidence") : "insufficient_evidence",
      matchedSkills: catJob.matchedSkills ?? [],
      missingSkills: catJob.missingSkills ?? [],
      stage,
      priority,
      salaryExpectation: salary || "",
      dateSaved: today,
      dateApplied: stage === "applied" ? today : undefined,
    };

    addCustomTrackedJob(newTracked, user?.id);
    setJobs((prev) => [newTracked, ...prev.filter((j) => j.id !== newTracked.id)]);

    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: catJob.id }),
      });
    } catch {
      // ignore
    }
  };

  const handleAddManualJob = (data: {
    title: string;
    company: string;
    location: string;
    stage: JobStage;
    priority: number;
    salary: string;
  }) => {
    const today = new Date().toISOString().split("T")[0];
    const customId = `custom_${Date.now()}`;
    const newTracked: TrackedJob = {
      id: customId,
      title: data.title,
      company: data.company,
      location: data.location || "Indonesia",
      employmentType: "",
      sourceName: "Ditambahkan sendiri",
      // Lowongan isian manual tidak punya data persyaratan, jadi kecocokan belum bisa dihitung
      matchScore: 0,
      matchStatus: "insufficient_evidence",
      matchedSkills: [],
      missingSkills: [],
      stage: data.stage,
      priority: data.priority,
      salaryExpectation: data.salary || "",
      dateSaved: today,
      dateApplied: data.stage === "applied" ? today : undefined,
    };

    addCustomTrackedJob(newTracked, user?.id);
    setJobs((prev) => [newTracked, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-6">
        <TrackerHeader
          stageCounts={stageCounts}
          activeStageFilter={activeStageFilter}
          onStageFilterChange={(newStage) => {
            setActiveStageFilter(newStage);
            updatePaginationUrl(1, pageSize);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            updatePaginationUrl(1, pageSize);
          }}
          sortBy={sortBy}
          onSortChange={(s) => {
            setSortBy(s);
            updatePaginationUrl(1, pageSize);
          }}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            if (mode === "board" && compareMode) toggleCompareMode();
          }}
          compareMode={compareMode}
          onToggleCompareMode={toggleCompareMode}
          canCompare={jobs.length >= 2}
          onOpenAdd={() => setShowAddModal(true)}
        />

        {compareMode && (
          <div
            role="status"
            className="sticky top-3 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-sb-blue/30 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-sm text-sb-navy">
              <strong>Pilih 2–4 lowongan</strong> untuk dibandingkan.{" "}
              <span className="text-sb-text-2">{selectedJobIds.size} dipilih</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleCompareMode}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedJobIds.size < 2}
                onClick={() => setIsCompareOpen(true)}
              >
                Bandingkan{selectedJobIds.size >= 2 ? ` ${selectedJobIds.size} lowongan` : ""}
              </Button>
            </div>
          </div>
        )}

        {/* MAIN VIEW: TABLE OR KANBAN */}
        {isLoading ? (
          <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-sb-blue border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-sb-text-2">
              Memuat status pelacakan lamaran...
            </p>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sb-mist-faint text-sb-blue flex items-center justify-center mx-auto border border-sb-border">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sb-navy">
                Belum ada lowongan di tahapan ini
              </h3>
              <p className="text-xs text-sb-text-2 mt-1 max-w-md mx-auto">
                Simpan lowongan menarik saat mencari lowongan atau tambahkan target pekerjaan
                kamu secara mandiri untuk mulai melacak.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/jobs">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Jelajahi Lowongan
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                Tambah Lowongan
              </Button>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <TrackerTable
            jobs={paginatedJobs}
            totalItems={displayedJobs.length}
            selectMode={compareMode}
            selectedJobIds={selectedJobIds}
            onToggleSelectJob={toggleSelectJob}
            onStageChange={handleStageChange}
            onPriorityChange={handlePriorityChange}
            onEditJob={(job) => setEditingJob(job)}
            onDeleteJob={handleDeleteJob}
            isPending={isPending}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        ) : (
          <TrackerBoard
            jobs={displayedJobs}
            onStageChange={handleStageChange}
            onPriorityChange={handlePriorityChange}
            onEditJob={(job) => setEditingJob(job)}
          />
        )}

        {/* MODAL EDIT DETAILS */}
        <EditJobModal
          job={editingJob}
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          onSave={handleSaveEdit}
        />

        {/* MODAL TAMBAH TARGET LOWONGAN */}
        <AddJobModal
          isOpen={showAddModal}
          catalogJobs={catalogJobs}
          onClose={() => setShowAddModal(false)}
          onAddCatalogJob={handleAddCatalogJob}
          onAddManualJob={handleAddManualJob}
        />

        {/* MODAL COMPARISON */}
        <JobComparisonModal
          jobs={comparisonJobs}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          onUpdateStage={handleStageChange}
        />
      </div>
    </div>
  );
}
