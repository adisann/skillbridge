"use client";

import React, { useState, useEffect, useMemo, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { FilterBar, FilterState } from "@/components/ui/filter";
import { JobCard } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/error";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { fetchDeduped } from "@/lib/fetcher";

interface LiveJob {
  id: string;
  externalId: string;
  title: string;
  canonicalTitle: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: string;
  sourceName: string;
  sourceUrl: string;
  retrievalMethod: string;
  retrievedAt: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchScore: number;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    workType: "all",
    seniority: "all",
    location: "all",
    postedDate: "all",
  });
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [referenceTime, setReferenceTime] = useState<number>(0);

  const updatePaginationUrl = (newPage: number, newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(newSize));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const queryParams = new URLSearchParams();
        if (filters.role !== "all") queryParams.append("role", filters.role);
        if (search.trim()) queryParams.append("q", search.trim());

        const [data, sData] = await Promise.all([
          fetchDeduped<{ jobs: LiveJob[] }>(`/api/jobs?${queryParams.toString()}`),
          fetchDeduped<{ savedJobIds?: string[] }>(`/api/saved-jobs`).catch(() => ({ savedJobIds: [] })),
        ]);

        setJobs(data.jobs || []);
        setReferenceTime(Date.now());
        if (sData.savedJobIds) setSavedJobIds(sData.savedJobIds);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "Gagal memuat lowongan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [filters.role, search, user?.id]);

  const handleToggleSave = async (id: string) => {
    const isCurrentlySaved = savedJobIds.includes(id);
    setSavedJobIds((prev) =>
      isCurrentlySaved ? prev.filter((jId) => jId !== id) : [...prev, id]
    );

    try {
      await fetchDeduped("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id }),
      });
    } catch {
      setSavedJobIds((prev) =>
        isCurrentlySaved ? [...prev, id] : prev.filter((jId) => jId !== id)
      );
    }
  };

  const filteredJobs = jobs.filter((job) => {
    // Filter Lokasi
    if (filters.location && filters.location !== "all") {
      const locTarget = filters.location.toLowerCase();
      const loc = (job.location || "").toLowerCase();
      if (locTarget === "remote") {
        if (!loc.includes("remote")) return false;
      } else {
        if (!loc.includes(locTarget)) return false;
      }
    }

    // Filter Tipe Kerja (Onsite eksklusif, tidak meloloskan hybrid)
    if (filters.workType !== "all") {
      const targetType = filters.workType.toLowerCase();
      const loc = (job.location || "").toLowerCase();
      const emp = (job.employmentType || "").toLowerCase();
      const isRemote = loc.includes("remote") || emp.includes("remote");
      const isHybrid = loc.includes("hybrid") || emp.includes("hybrid");

      if (targetType === "remote" && !isRemote) return false;
      if (targetType === "hybrid" && !isHybrid) return false;
      if (targetType === "onsite" && (isRemote || isHybrid)) return false;
    }

    // Filter Senioritas
    if (filters.seniority !== "all") {
      const targetSen = filters.seniority.toLowerCase();
      const sen = (job.seniority || "").toLowerCase();
      if (!sen.includes(targetSen)) return false;
    }

    // Filter Tanggal
    if (filters.postedDate && filters.postedDate !== "all") {
      const days = filters.postedDate === "7d" ? 7 : filters.postedDate === "14d" ? 14 : 30;
      const maxAgeMs = days * 24 * 60 * 60 * 1000;
      const retDate = job.retrievedAt ? new Date(job.retrievedAt).getTime() : 0;
      if (referenceTime > 0 && retDate > 0 && referenceTime - retDate > maxAgeMs) return false;
    }

    return true;
  });

  // Derive page & pageSize directly from URL query params
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawPageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const pageSize = [10, 20, 50].includes(rawPageSize) ? rawPageSize : 10;
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
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
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cari Lowongan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Menampilkan lowongan aktif dari Greenhouse, Lever, JobStreet Indonesia, dan LinkedIn yang dipadankan dengan CV-mu.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Skor menunjukkan kecocokan CV dengan persyaratan, bukan peluang diterima.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cv">
            <Button variant="primary" size="sm">
              Koreksi CV
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <AlertBanner
          type="error"
          title="Gagal Memuat Lowongan"
          message={errorMsg}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Cari posisi pekerjaan, perusahaan, atau skill (cth. SQL, Python, Tableau)..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            updatePaginationUrl(1, pageSize);
          }}
        />
        <FilterBar
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            updatePaginationUrl(1, pageSize);
          }}
          onReset={() => {
            setFilters({
              role: "all",
              workType: "all",
              seniority: "all",
              location: "all",
              postedDate: "all",
            });
            updatePaginationUrl(1, pageSize);
          }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Tidak Ada Lowongan yang Cocok dengan Kriteria"
            description="Coba ubah kata kunci pencarian atau sesuaikan filter role dan tipe kerja."
            actionLabel="Reset Semua Filter"
            onAction={() => {
              setSearch("");
              setFilters({ role: "all", workType: "all", seniority: "all" });
              updatePaginationUrl(1, pageSize);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-800">
              {filteredJobs.length} lowongan ditemukan
            </span>
            <span>
              Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredJobs.length / pageSize))}
            </span>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-150",
              isPending ? "opacity-40" : "opacity-100"
            )}
          >
            {paginatedJobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company={job.company}
                location={job.location}
                employmentType={job.employmentType}
                seniority={job.seniority}
                sourceName={job.sourceName}
                sourceUrl={job.sourceUrl}
                matchScore={job.matchScore}
                matchStatus={job.matchStatus}
                matchedSkills={job.matchedSkills}
                missingSkills={job.missingSkills}
                isSaved={savedJobIds.includes(job.id)}
                onSaveToggle={() => handleToggleSave(job.id)}
                onViewDetails={() => router.push(`/jobs/${job.id}`)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredJobs.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="lowongan"
          />
        </div>
      )}
    </div>
  );
}
