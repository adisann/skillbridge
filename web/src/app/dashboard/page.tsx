"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileUp,
  TrendingUp,
  ClipboardList,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { TrackedJob, JobStage } from "@/types/tracker";
import { mergeServerAndLocalJobs, ServerSavedJob } from "@/lib/tracker-storage";
import { fetchDeduped } from "@/lib/fetcher";

interface DashboardJob {
  id: string;
  title: string;
  company: string;
  location: string;
  canonicalTitle: string;
  matchScore: number;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  const [topMarketSkills, setTopMarketSkills] = useState<Array<{ skillName: string; percentage: number }>>([]);
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [hasCv, setHasCv] = useState(false);
  const [recommendations, setRecommendations] = useState<
    Array<{ skillName: string; demandPercentage: number; reason: string; priority: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (user?.targetRole) queryParams.append("role", user.targetRole);

        const [jobsData, insightsData, savedData, cvData] = await Promise.all([
          fetchDeduped<{ jobs: DashboardJob[]; total: number }>(`/api/jobs?${queryParams.toString()}`),
          fetchDeduped<{
            sampleSizeN: number;
            topSkills: Array<{ skillName: string; percentage: number }>;
            learningRecommendations: Array<{ skillName: string; demandPercentage: number; reason: string; priority: string }>;
          }>(`/api/insights?${queryParams.toString()}`),
          fetchDeduped<{ savedJobs?: ServerSavedJob[] }>(`/api/saved-jobs`),
          fetchDeduped<{ resume?: { skills: string[] } }>(`/api/cv/save`),
        ]);

        if (cvData.resume && cvData.resume.skills && cvData.resume.skills.length > 0) {
          setCvSkills(cvData.resume.skills);
          setHasCv(true);
        } else {
          setCvSkills([]);
          setHasCv(false);
        }

        if (jobsData.jobs) {
          setJobs(jobsData.jobs);
          setTotalJobsCount(insightsData.sampleSizeN ?? jobsData.total ?? jobsData.jobs.length);
        }

        if (insightsData.topSkills) {
          setTopMarketSkills(insightsData.topSkills.slice(0, 3));
        }

        if (insightsData.learningRecommendations) {
          setRecommendations(insightsData.learningRecommendations);
        }

        const serverSaved = savedData.savedJobs || [];
        const mergedTracked = mergeServerAndLocalJobs(serverSaved, user?.id);
        setTrackedJobs(mergedTracked);
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id, user?.targetRole]);

  // Stage pipeline summary counts
  const stageStats = useMemo(() => {
    const counts: Record<JobStage, number> = {
      bookmarked: 0,
      applying: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
    };
    trackedJobs.forEach((j) => {
      if (counts[j.stage] !== undefined) {
        counts[j.stage] += 1;
      }
    });
    return counts;
  }, [trackedJobs]);

  const highPriorityTracked = useMemo(() => {
    return trackedJobs
      .filter((j) => (j.priority || 0) >= 4)
      .slice(0, 3);
  }, [trackedJobs]);

  // Urutkan lowongan rekomendasi berdasarkan matchScore tertinggi dan filter target role
  const sortedRecommendedJobs = useMemo(() => {
    const target = user?.targetRole?.toLowerCase() || "";
    let filtered = jobs;
    if (target && target !== "all" && target !== "semua bidang") {
      const matched = jobs.filter(
        (j) =>
          j.canonicalTitle?.toLowerCase().includes(target) ||
          j.title?.toLowerCase().includes(target)
      );
      if (matched.length > 0) filtered = matched;
    }
    return [...filtered].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [jobs, user?.targetRole]);

  // Hitung tingkat kesiapan CV dinamis
  const cvReadinessScore = useMemo(() => {
    if (!hasCv || cvSkills.length === 0) return 0;
    if (sortedRecommendedJobs.length === 0) return 75;
    const topScored = sortedRecommendedJobs.slice(0, 5);
    const avg = topScored.reduce((acc, cur) => acc + (cur.matchScore || 0), 0) / topScored.length;
    return Math.min(95, Math.max(25, Math.round(avg)));
  }, [hasCv, cvSkills, sortedRecommendedJobs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* Dashboard Top Header Bar                                            */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 select-none">
              {user?.targetRole || "Semua Bidang"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Selamat datang, <strong className="text-slate-800">{user?.fullName || "Kawan SkillBridge"}</strong>. Pantau kesiapan CV, lowongan relevan, dan proses lamaranmu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cv">
            <Button variant="outline" size="sm" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
              Koreksi CV
            </Button>
          </Link>
          <Link href="/tracker">
            <Button variant="primary" size="sm" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}>
              Lamaran Saya
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      ) : (
        /* ----------------------------------------------------------------- */
        /* 12-COLUMN PROFESSIONAL BENTO GRID                                 */
        /* ----------------------------------------------------------------- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* =============================================================== */}
          {/* BENTO CARD 1: Kesiapan CV & Target Karier (Col 1-7)             */}
          {/* =============================================================== */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs bento-card animate-fade-in-up stagger-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  Kesiapan Profil CV
                </span>
                <span className="text-xs font-semibold text-slate-500">Target: {user?.targetRole || "Semua Bidang"}</span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {hasCv ? `Tingkat Kesiapan CV: ${cvReadinessScore}%` : "Kesiapan CV: Belum Ada Data"}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {hasCv
                    ? `Kualifikasi CV-mu mencakup ${cvSkills.length} keahlian terverifikasi. Kami membandingkannya secara langsung dengan kebutuhan riil lowongan.`
                    : "Unggah CV, dan kami bandingkan dengan lowongan aktif di berbagai bidang. Kamu langsung tahu skill mana yang kurang."}
                </p>
              </div>

              {/* Verified skills pill list */}
              <div className="pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {hasCv ? "Keahlian Teridentifikasi di CV-mu:" : "Keahlian di CV:"}
                </p>
                {hasCv && cvSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {cvSkills.slice(0, 8).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        {s}
                      </span>
                    ))}
                    {cvSkills.length > 8 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        +{cvSkills.length - 8} lainnya
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                    Belum ada CV yang diunggah. Unggah CV untuk mendeteksi keahlianmu.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <Link href="/cv">
                <Button variant="primary" size="sm" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
                  {hasCv ? "Koreksi CV" : "Unggah CV Sekarang"}
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Cari Lowongan
                </Button>
              </Link>
            </div>
          </div>

          {/* =============================================================== */}
          {/* BENTO CARD 2: Inteligensi Kebutuhan Pasar (Col 8-12)             */}
          {/* =============================================================== */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs bento-card animate-fade-in-up stagger-2 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Statistik Pasar Kerja
              </span>

              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {totalJobsCount}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  lowongan aktif untuk {user?.targetRole || "Data Analyst"}
                </p>
              </div>

              {/* Top market skills ranking */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Skill yang Paling Dicari:
                </p>
                {topMarketSkills.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {topMarketSkills.map((item, idx) => (
                      <div key={item.skillName} className="space-y-1">
                        <div className="flex items-center justify-between text-slate-700 font-semibold">
                          <span>{idx + 1}. {item.skillName}</span>
                          <span className="text-blue-600 font-bold">{item.percentage}% lowongan</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-xs text-slate-400 italic">
                    Memuat data skill pasar...
                  </div>
                )}
              </div>
            </div>

            <Link href="/insights" className="block pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                rightIcon={<TrendingUp className="w-3.5 h-3.5 text-blue-600" />}
              >
                <span>Lihat Tren Skill Lengkap</span>
              </Button>
            </Link>
          </div>

          {/* =============================================================== */}
          {/* BENTO CARD 3: Ringkasan 7 Tahapan Lamaran (Col 1-12)             */}
          {/* =============================================================== */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs bento-card animate-fade-in-up stagger-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pipeline Pelacakan
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Status Lamaran Kerja ({trackedJobs.length} Posisi Dipantau)
                </h3>
              </div>
              <Link href="/tracker">
                <span className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Buka Tracker <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            {/* 7 Stage Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {(
                [
                  { key: "bookmarked", label: "Tersimpan", count: stageStats.bookmarked, color: "text-slate-800" },
                  { key: "applying", label: "Siapkan Berkas", count: stageStats.applying, color: "text-blue-700" },
                  { key: "applied", label: "Sudah Melamar", count: stageStats.applied, color: "text-indigo-700" },
                  { key: "interviewing", label: "Wawancara", count: stageStats.interviewing, color: "text-amber-700" },
                  { key: "offered", label: "Penawaran", count: stageStats.offered, color: "text-purple-700" },
                  { key: "accepted", label: "Diterima", count: stageStats.accepted, color: "text-emerald-700" },
                  { key: "rejected", label: "Ditolak", count: stageStats.rejected, color: "text-rose-700" },
                ] as const
              ).map((stage) => (
                <Link
                  key={stage.key}
                  href={`/tracker?stage=${stage.key}`}
                  className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-colors duration-150 flex flex-col justify-between"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    {stage.label}
                  </p>
                  <p className={cn("text-xl sm:text-2xl font-extrabold tracking-tight mt-1", stage.color)}>
                    {stage.count}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* =============================================================== */}
          {/* BENTO CARD 4: Lowongan Relevan Terpilih (Col 1-8)                */}
          {/* =============================================================== */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs bento-card animate-fade-in-up stagger-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Rekomendasi Teratas
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Peluang Kerja Paling Sesuai
                </h3>
              </div>
              <Link href="/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
                Lihat Semua ({sortedRecommendedJobs.length})
              </Link>
            </div>

            {sortedRecommendedJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-200 space-y-2">
                <p>Belum ada data lowongan yang dimuat.</p>
                <Link href="/jobs">
                  <Button variant="outline" size="sm">
                    Cari Lowongan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRecommendedJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[240px] sm:max-w-[320px]">
                          {job.title}
                        </h4>
                        <MatchBadge status={job.matchStatus} score={job.matchScore} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {job.company} • {job.location}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {job.matchedSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                          >
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Lihat Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* BENTO CARD 5: Prioritas Belajar & Target Cepat (Col 9-12)        */}
          {/* =============================================================== */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs bento-card animate-fade-in-up stagger-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Belajar
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Prioritas Peningkatan Skill
                </h3>
              </div>

              {recommendations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-200">
                  Profil CV-mu sudah mencakup sebagian besar kebutuhan pasar.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.skillName}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900">{rec.skillName}</span>
                        <span className="text-blue-600">{rec.demandPercentage}% pasar</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* High Priority Tracked Jobs */}
              {highPriorityTracked.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Target Prioritas Tinggi:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {highPriorityTracked.map((j) => (
                      <Link
                        key={j.id}
                        href="/tracker"
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate text-[11px]">{j.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{j.company}</p>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span className="text-[10px] font-bold text-slate-700">{j.priority}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link href="/progress" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  <span>Daftar Rencana Belajar</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
