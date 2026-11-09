"use client";

import { CareerContextBar } from "@/components/career-context-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchInput } from "@/components/ui/input";
import { FilterBar } from "@/components/ui/filter";
import { JobCard } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/error";
import { Pagination } from "@/components/ui/pagination";
import { JobExplorerBanner } from "@/components/jobs/job-explorer-banner";
import { JobPreviewPanel } from "@/components/jobs/job-preview-panel";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { fetchDeduped } from "@/lib/fetcher";
import { countJobsByCategory, filterJobs, sortByTargetFit } from "@/lib/job-list";
import { useJobFeed } from "@/lib/hooks/use-job-feed";
import { useExplorerFilters, DEFAULT_FILTERS } from "@/lib/hooks/use-explorer-filters";
import { useUrlPagination } from "@/lib/hooks/use-url-pagination";

interface JobExplorerProps {
  mode?: "guest" | "user";
}

export function JobExplorer({ mode = "user" }: JobExplorerProps) {
  const isGuest = mode === "guest";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();

  const urlBidang = searchParams.get("bidang") || searchParams.get("role") || null;
  const { filters, setFilters, userCategory } = useExplorerFilters({
    isGuest,
    isLoggedIn: !!user,
    urlBidang,
    userTargetRole: user?.targetRole,
  });
  const [search, setSearch] = useState("");
  const {
    jobs,
    isLoading,
    errorMsg,
    referenceTime,
    savedJobIds,
    setSavedJobIds,
    selectedJobId,
    setSelectedJobId,
  } = useJobFeed({ role: filters.role, search, userId: user?.id, isGuest });
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll panel kembali ke atas saat lowongan aktif berganti
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedJobId]);

  const categoryCounts = useMemo(() => countJobsByCategory(jobs), [jobs]);

  const userTargetRole = user?.targetRole;
  const filteredJobs = useMemo(() => {
    const list = filterJobs(jobs, filters, referenceTime);
    if (isGuest && filters.role === "all" && !search.trim()) {
      const core = new Set(["data-analitik", "bisnis-strategi", "produk-desain", "software"]);
      return [...list].sort((a,b) => Number(core.has(b.category || ""))-Number(core.has(a.category || "")) || (Date.parse(b.retrievedAt) || 0)-(Date.parse(a.retrievedAt) || 0));
    }
    return isGuest ? list : sortByTargetFit(list, filters.role, userTargetRole);
  }, [jobs, filters, referenceTime, userTargetRole, isGuest, search]);

  const { currentPage, pageSize, totalPages, isPending, resetToFirstPage, changePage, changePageSize } =
    useUrlPagination(filteredJobs.length);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Lowongan terpilih untuk master-detail desktop
  const activeJob = useMemo(
    () => filteredJobs.find((j) => j.id === selectedJobId) || paginatedJobs[0] || null,
    [filteredJobs, paginatedJobs, selectedJobId]
  );

  const detailRoutePrefix = isGuest ? "/lowongan" : "/jobs";

  const handleToggleSave = async (id: string) => {
    if (isGuest) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const isCurrentlySaved = savedJobIds.includes(id);
    setSavedJobIds((prev) => (isCurrentlySaved ? prev.filter((jId) => jId !== id) : [...prev, id]));

    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id }),
      });
    } catch {
      setSavedJobIds((prev) => (isCurrentlySaved ? [...prev, id] : prev.filter((jId) => jId !== id)));
    }
  };

  const handleSelectOrViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      router.push(`${detailRoutePrefix}/${jobId}`);
    }
  };

  const showUserCategoryNote =
    !isGuest && user && userCategory && filters.role === userCategory.slug && !urlBidang;

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {!isGuest && <CareerContextBar />}
      <JobExplorerBanner isGuest={isGuest} isLoggedIn={!!user} role={filters.role} />

      {errorMsg && <AlertBanner type="error" title="Gagal Memuat Lowongan" message={errorMsg} />}

      <div className="space-y-4">
        <SearchInput
          placeholder="Cari posisi pekerjaan, perusahaan, atau skill (cth. SQL, Python, Figma)..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            resetToFirstPage();
          }}
        />
        <FilterBar
          filters={filters}
          categoryCounts={categoryCounts}
          onChange={(newFilters) => {
            setFilters(newFilters);
            resetToFirstPage();
          }}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            resetToFirstPage();
          }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="lg:col-span-7 hidden lg:block">
            <SkeletonCard />
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Tidak Ada Lowongan yang Cocok dengan Kriteria"
            description="Coba ubah kata kunci pencarian atau sesuaikan filter bidang dan tipe kerja."
            actionLabel="Reset Semua Filter"
            onAction={() => {
              setSearch("");
              setFilters(DEFAULT_FILTERS);
              resetToFirstPage();
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sb-text-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sb-navy">{filteredJobs.length} lowongan ditemukan</span>
              {showUserCategoryNote && (
                <span className="text-sb-text-2 font-medium">
                  · Menampilkan bidang {userCategory.label} ·{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, role: "all" }));
                      resetToFirstPage();
                    }}
                    className="font-bold text-sb-blue hover:underline cursor-pointer"
                  >
                    Ubah
                  </button>
                </span>
              )}
            </div>
            <span className="font-medium text-sb-text-2">
              Halaman {currentPage} dari {totalPages}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div
              className={cn(
                "lg:col-span-6 xl:col-span-5 min-w-0 space-y-4 transition-opacity duration-150 pb-8",
                isPending ? "opacity-40" : "opacity-100"
              )}
            >
              {paginatedJobs.map((job) => (
                <div key={job.id} onClick={() => handleSelectOrViewJob(job.id)} className="cursor-pointer">
                  <JobCard
                    id={job.id}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    employmentType={job.employmentType}
                    seniority={job.seniority}
                    salaryMin={job.salaryMin}
                    salaryMax={job.salaryMax}
                    salaryPeriod={job.salaryPeriod}
                    sourceUrl={job.sourceUrl}
                    matchScore={isGuest ? null : job.matchScore}
                    matchStatus={isGuest ? "insufficient_evidence" : job.matchStatus}
                    matchedSkills={isGuest ? [] : job.matchedSkills}
                    missingSkills={isGuest ? [] : job.missingSkills}
                    requiredSkills={job.requiredSkills}
                    mode={mode}
                    isSaved={savedJobIds.includes(job.id)}
                    isSelected={activeJob?.id === job.id}
                    onSaveToggle={() => handleToggleSave(job.id)}
                    onViewDetails={() => handleSelectOrViewJob(job.id)}
                  />
                </div>
              ))}

              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredJobs.length}
                  pageSize={pageSize}
                  onPageChange={changePage}
                  onPageSizeChange={changePageSize}
                  itemLabel="lowongan"
                />
              </div>
            </div>

            {activeJob && (
              <JobPreviewPanel
                job={activeJob}
                isGuest={isGuest}
                isSaved={savedJobIds.includes(activeJob.id)}
                detailRoutePrefix={detailRoutePrefix}
                panelRef={panelRef}
                onToggleSave={() => handleToggleSave(activeJob.id)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
