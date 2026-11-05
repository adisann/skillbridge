"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { FilterBar, FilterState } from "@/components/ui/filter";
import { JobCard } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/error";
import { useAuth } from "@/lib/supabase/auth-context";

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
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    workType: "all",
    seniority: "all",
  });
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const queryParams = new URLSearchParams();
        if (filters.role !== "all") queryParams.append("role", filters.role);
        if (search.trim()) queryParams.append("q", search.trim());
        if (user?.id) queryParams.append("userId", user.id);

        const res = await fetch(`/api/jobs?${queryParams.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Gagal memuat lowongan");
        setJobs(data.jobs || []);

        // Muat ID lowongan tersimpan
        const sRes = await fetch(`/api/saved-jobs?${queryParams.toString()}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.savedJobIds) setSavedJobIds(sData.savedJobIds);
        }
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
      await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, jobId: id }),
      });
    } catch {
      setSavedJobIds((prev) =>
        isCurrentlySaved ? [...prev, id] : prev.filter((jId) => jId !== id)
      );
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filters.workType !== "all") {
      const targetType = filters.workType.toLowerCase();
      const loc = (job.location || "").toLowerCase();
      const emp = (job.employmentType || "").toLowerCase();
      const isRemote = loc.includes("remote") || emp.includes("remote");
      const isHybrid = loc.includes("hybrid") || emp.includes("hybrid");

      if (targetType === "remote" && !isRemote) return false;
      if (targetType === "hybrid" && !isHybrid) return false;
      if (targetType === "onsite" && isRemote) return false;
    }
    if (filters.seniority !== "all") {
      const targetSen = filters.seniority.toLowerCase();
      const sen = (job.seniority || "").toLowerCase();
      if (!sen.includes(targetSen)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Explorer (Cari Lowongan Nyata)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Menampilkan lowongan aktif dari Greenhouse, Lever, JobStreet Indonesia, dan LinkedIn yang dipadankan dengan CV Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/insights">
            <Button variant="outline" size="sm" rightIcon={<Sparkles className="w-4 h-4 text-emerald-600" />}>
              Market Insights
            </Button>
          </Link>
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

      {/* Catatan Transparansi Skor */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Prinsip Transparansi Penilaian:</span> Skor kesesuaian adalah estimasi matematis kualifikasi CV Anda terhadap persyaratan lowongan (exact skill, experience, & semantic), bukan peluang atau probabilitas diterima kerja.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Cari posisi pekerjaan, perusahaan, atau skill (cth. SQL, Python, Tableau)..."
          value={search}
          onChange={(val) => setSearch(val)}
        />
        <FilterBar filters={filters} onChange={setFilters} />
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
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredJobs.length} lowongan aktif</strong> dari basis data Supabase
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
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
        </div>
      )}
    </div>
  );
}
