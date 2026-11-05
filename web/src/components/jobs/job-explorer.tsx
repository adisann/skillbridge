"use client";

import React, { useState, useEffect, useMemo, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { FilterBar, FilterState } from "@/components/ui/filter";
import { JobCard } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { MatchBadge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/error";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { fetchDeduped } from "@/lib/fetcher";
import { getCategoryFromTitle, getCategoryBySlug } from "@/lib/job-categories";

export interface LiveJob {
  id: string;
  externalId: string;
  title: string;
  canonicalTitle: string;
  category?: string;
  categoryLabel?: string;
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
  matchScore: number | null;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
  factorsSupporting: string[];
  factorsLimiting: string[];
}

export interface JobExplorerProps {
  mode?: "guest" | "user";
}

export function JobExplorer({ mode = "user" }: JobExplorerProps) {
  const isGuest = mode === "guest";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, loginDemoJuri } = useAuth();

  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const urlBidang = searchParams.get("bidang") || searchParams.get("role") || null;
  const userTargetRole = user?.targetRole;

  // Tentukan kategori bidang default dari profil pengguna login jika tidak ada param URL
  const userCategory = useMemo(() => {
    if (!userTargetRole) return undefined;
    const bySlug = getCategoryBySlug(userTargetRole);
    if (bySlug) return bySlug;
    return getCategoryFromTitle(userTargetRole, userTargetRole);
  }, [userTargetRole]);

  const defaultRole = urlBidang || (!isGuest && user ? userCategory?.slug || "all" : "all");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    role: defaultRole,
    workType: "all",
    seniority: "all",
    location: "all",
    postedDate: "all",
  });
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [referenceTime, setReferenceTime] = useState<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll panel kembali ke atas saat lowongan aktif berganti
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedJobId]);

  // Sync parameter URL jika berubah dari luar (pola render-time adjustment)
  const [prevUrlBidang, setPrevUrlBidang] = useState(urlBidang);
  if (prevUrlBidang !== urlBidang) {
    setPrevUrlBidang(urlBidang);
    setFilters((prev) => ({
      ...prev,
      role: urlBidang || (!isGuest && user ? userCategory?.slug || "all" : "all"),
    }));
  }

  // Jika targetRole user termuat dan tidak ada param di URL (pola render-time adjustment)
  const [prevUserTargetRole, setPrevUserTargetRole] = useState(userTargetRole);
  if (prevUserTargetRole !== userTargetRole) {
    setPrevUserTargetRole(userTargetRole);
    if (!isGuest && !urlBidang && userCategory && filters.role === "all") {
      setFilters((prev) => ({ ...prev, role: userCategory.slug }));
    }
  }

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
        if (filters.role !== "all") queryParams.append("bidang", filters.role);
        if (search.trim()) queryParams.append("q", search.trim());

        const fetches: [Promise<{ jobs: LiveJob[] }>, Promise<{ savedJobIds?: string[] }>] = [
          fetchDeduped<{ jobs: LiveJob[] }>(`/api/jobs?${queryParams.toString()}`),
          !isGuest
            ? fetchDeduped<{ savedJobIds?: string[] }>("/api/saved-jobs").catch(() => ({ savedJobIds: [] }))
            : Promise.resolve({ savedJobIds: [] }),
        ];

        const [data, sData] = await Promise.all(fetches);

        const fetchedJobs = data.jobs || [];
        setJobs(fetchedJobs);
        setReferenceTime(Date.now());
        if (sData.savedJobIds) setSavedJobIds(sData.savedJobIds);

        // Default selected job to first in list
        if (fetchedJobs.length > 0) {
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
  }, [filters.role, search, user?.id, isGuest]);

  const handleToggleSave = async (id: string) => {
    if (isGuest) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
      return;
    }

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

  // Hitung jumlah lowongan per kategori untuk filter
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of jobs) {
      const cat = j.category || getCategoryFromTitle(j.title, j.canonicalTitle).slug;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [jobs]);

  // Saring dan urutkan lowongan
  const filteredJobs = useMemo(() => {
    const list = jobs.filter((job) => {
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

      // Filter Tipe Kerja
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

    if (isGuest) {
      return list;
    }

    // Urutkan untuk pengguna login: Bidang target diutamakan jika filter "all", lalu urut matchScore
    const target = user?.targetRole ? user.targetRole.toLowerCase() : "";
    return list.sort((a, b) => {
      if (filters.role === "all" && target) {
        const aCat = (a.category || "").toLowerCase();
        const bCat = (b.category || "").toLowerCase();
        const aMatchesTarget = aCat.includes(target) || target.includes(aCat);
        const bMatchesTarget = bCat.includes(target) || target.includes(bCat);
        if (aMatchesTarget && !bMatchesTarget) return -1;
        if (!aMatchesTarget && bMatchesTarget) return 1;
      }

      const scoreA = a.matchScore ?? -1;
      const scoreB = b.matchScore ?? -1;
      return scoreB - scoreA;
    });
  }, [jobs, filters, referenceTime, user, isGuest]);

  // Derive page & pageSize
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

  // Selected job for desktop master-detail
  const activeJob = useMemo(() => {
    return (
      filteredJobs.find((j) => j.id === selectedJobId) ||
      paginatedJobs[0] ||
      null
    );
  }, [filteredJobs, paginatedJobs, selectedJobId]);

  const detailRoutePrefix = isGuest ? "/lowongan" : "/jobs";

  const handleSelectOrViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      router.push(`${detailRoutePrefix}/${jobId}`);
    }
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* =================================================================== */}
      {/* 1. PAGE BANNER                                                      */}
      {/* =================================================================== */}
      <div className="page-banner p-6 sm:p-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy">
              Lowongan Pekerjaan
            </h1>
            <p className="text-xs sm:text-sm text-sb-text-2 leading-relaxed max-w-xl">
              {isGuest
                ? "Lowongan dari berbagai situs kerja."
                : user
                ? "Lowongan dari berbagai situs kerja, diurutkan sesuai CV-mu."
                : "Lowongan dari berbagai situs kerja."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isGuest ? (
              <Link
                href={filters.role !== "all" ? `/tren-skill?bidang=${filters.role}` : "/tren-skill"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sb-blue hover:underline"
              >
                <span>Tren skill di bidang ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/insights">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs font-bold px-5"
                  >
                    Lihat Tren Skill
                  </Button>
                </Link>
                <Link href="/cv">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold px-5"
                  >
                    Koreksi CV
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <AlertBanner
          type="error"
          title="Gagal Memuat Lowongan"
          message={errorMsg}
        />
      )}

      {/* =================================================================== */}
      {/* 2. SEARCH & GLASS FILTER BAR                                        */}
      {/* =================================================================== */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Cari posisi pekerjaan, perusahaan, atau skill (cth. SQL, Python, Figma)..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            updatePaginationUrl(1, pageSize);
          }}
        />
        <FilterBar
          filters={filters}
          categoryCounts={categoryCounts}
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

      {/* =================================================================== */}
      {/* 3. CONTENT AREA: MASTER-DETAIL ON DESKTOP, CARDS ON MOBILE          */}
      {/* =================================================================== */}
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
              setFilters({ role: "all", workType: "all", seniority: "all" });
              updatePaginationUrl(1, pageSize);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sb-text-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sb-navy">
                {filteredJobs.length} lowongan ditemukan
              </span>
              {!isGuest && user && userCategory && filters.role === userCategory.slug && !urlBidang && (
                <span className="text-sb-text-2 font-medium">
                  · Menampilkan bidang {userCategory.label} ·{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, role: "all" }));
                      updatePaginationUrl(1, pageSize);
                    }}
                    className="font-bold text-sb-blue hover:underline cursor-pointer"
                  >
                    Ubah
                  </button>
                </span>
              )}
            </div>
            <span className="font-medium text-sb-text-2">
              Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredJobs.length / pageSize))}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: LISTINGS (6 cols on lg, 5 cols on xl) */}
            <div
              className={cn(
                "lg:col-span-6 xl:col-span-5 min-w-0 space-y-4 transition-opacity duration-150 pb-8",
                isPending ? "opacity-40" : "opacity-100"
              )}
            >
              {paginatedJobs.map((job) => {
                const isSelected = activeJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectOrViewJob(job.id)}
                    className="cursor-pointer"
                  >
                    <JobCard
                      id={job.id}
                      title={job.title}
                      company={job.company}
                      location={job.location}
                      employmentType={job.employmentType}
                      seniority={job.seniority}
                      sourceUrl={job.sourceUrl}
                      matchScore={isGuest ? null : job.matchScore}
                      matchStatus={isGuest ? "insufficient_evidence" : job.matchStatus}
                      matchedSkills={isGuest ? [] : job.matchedSkills}
                      missingSkills={isGuest ? [] : job.missingSkills}
                      requiredSkills={job.requiredSkills}
                      mode={mode}
                      isSaved={savedJobIds.includes(job.id)}
                      isSelected={isSelected}
                      onSaveToggle={() => handleToggleSave(job.id)}
                      onViewDetails={() => handleSelectOrViewJob(job.id)}
                    />
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredJobs.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  itemLabel="lowongan"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: DESKTOP MASTER-DETAIL PREVIEW (6 cols on lg, 7 cols on xl, sticky) */}
            {activeJob && (
              <div
                className={cn(
                  "hidden lg:block lg:col-span-6 xl:col-span-7 sticky self-start",
                  isGuest ? "top-[88px]" : "top-6"
                )}
              >
                <div
                  ref={panelRef}
                  className={cn(
                    "glass-panel rounded-[24px] shadow-md overflow-y-auto overscroll-contain sb-panel-scroll",
                    isGuest ? "max-h-[calc(100svh-112px)]" : "max-h-[calc(100svh-48px)]"
                  )}
                >
                  {/* Sticky Detail Header & CTA Bar */}
                  <div className="sticky top-0 z-20 bg-[var(--sb-glass-bg-strong)] backdrop-blur-md p-5 sm:p-6 pb-4 border-b border-sb-border rounded-t-[24px] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sb-navy bg-sb-mist-soft px-2.5 py-0.5 rounded-full border border-sb-border">
                            {activeJob.canonicalTitle || activeJob.title}
                          </span>
                          {activeJob.seniority && (
                            <span className="text-xs font-semibold text-sb-text-2 bg-sb-mist-faint px-2 py-0.5 rounded-full border border-sb-border">
                              {activeJob.seniority}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-sb-navy tracking-tight leading-snug line-clamp-2">
                          {activeJob.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-sb-text-2 pt-0.5">
                          <span className="flex items-center gap-1.5 text-sb-navy">
                            <Building2 className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                            <span className="truncate max-w-[170px]">{activeJob.company}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                            <span className="truncate max-w-[140px]">{activeJob.location}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                            <span>{activeJob.employmentType}</span>
                          </span>
                        </div>
                      </div>

                      {!isGuest && (
                        <div className="shrink-0 flex flex-col items-center gap-1.5">
                          <ScoreRing score={activeJob.matchScore} size="md" showLabel={false} />
                          <MatchBadge status={activeJob.matchStatus} score={activeJob.matchScore} size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Quick Action CTA Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {activeJob.sourceUrl && (
                        <a
                          href={activeJob.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            rightIcon={<ExternalLink className="w-3.5 h-3.5 ml-1" />}
                            className="px-4 text-xs font-bold whitespace-nowrap"
                          >
                            Lamar di Sumber Asli
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSave(activeJob.id)}
                        leftIcon={
                          <Bookmark
                            className={cn(
                              "w-3.5 h-3.5 shrink-0",
                              savedJobIds.includes(activeJob.id) && "fill-sb-blue text-sb-blue"
                            )}
                          />
                        }
                        className="px-3.5 text-xs font-semibold shrink-0 whitespace-nowrap"
                      >
                        {savedJobIds.includes(activeJob.id) ? "Tersimpan" : "Simpan Lowongan"}
                      </Button>
                      <Link href={`${detailRoutePrefix}/${activeJob.id}`} className="shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-3.5 text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5"
                        >
                          Buka Detail <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Panel Scrollable Body */}
                  <div className="p-5 sm:p-6 pt-5 pb-24 sm:pb-28 space-y-5">
                    {/* Mode Tamu: Kartu Ajakan Masuk / Akun Demo */}
                    {isGuest && (
                      <div className="p-5 rounded-2xl bg-sb-mist-soft border border-sb-border space-y-3">
                        <h4 className="text-sm font-bold text-sb-navy">
                          Masuk untuk melihat skill mana yang sudah ada di CV-mu
                        </h4>
                        <p className="text-xs text-sb-text-2 leading-relaxed">
                          Unggah CV atau gunakan akun demo juri untuk membandingkan kualifikasi secara otomatis dengan lowongan ini.
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <Link href={`/login?next=${encodeURIComponent(`${detailRoutePrefix}/${activeJob.id}`)}`}>
                            <Button variant="primary" size="sm">
                              Masuk
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              await loginDemoJuri();
                              router.push(`/jobs/${activeJob.id}`);
                            }}
                          >
                            Coba akun demo
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Requirements Section */}
                    <div className="space-y-4 pt-1">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-sb-navy">
                        Persyaratan Kualifikasi
                      </h3>

                      {isGuest ? (
                        /* Mode Tamu: Tampilkan skill wajib & tambahan sebagai chip netral */
                        <div className="space-y-3">
                          {activeJob.requiredSkills && activeJob.requiredSkills.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold text-sb-navy">Skill Wajib:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeJob.requiredSkills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-3 py-1 rounded-full bg-sb-mist-soft text-sb-navy border border-sb-border text-xs font-semibold"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {activeJob.preferredSkills && activeJob.preferredSkills.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-xs font-bold text-sb-text-2">Skill Tambahan:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeJob.preferredSkills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-3 py-1 rounded-full bg-sb-mist-faint text-sb-navy border border-sb-border text-xs font-semibold"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Mode User: Matched & Missing Skills dari CV */
                        <div className="space-y-3">
                          {activeJob.matchedSkills.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-sb-good">
                                <CheckCircle2 className="w-4 h-4 text-sb-good" />
                                <span>Keahlian yang cocok di CV ({activeJob.matchedSkills.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {activeJob.matchedSkills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-3 py-1 rounded-full bg-emerald-50 text-sb-good border border-emerald-200 text-xs font-semibold"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeJob.missingSkills.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-sb-critical">
                                <XCircle className="w-4 h-4 text-sb-critical" />
                                <span>Keahlian belum ditemukan di CV ({activeJob.missingSkills.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {activeJob.missingSkills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-3 py-1 rounded-full bg-sb-mist-faint text-sb-text-2 border border-sb-border text-xs font-semibold"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

