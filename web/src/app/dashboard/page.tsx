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
import { formatPercent } from "@/lib/copy";

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

  // Kumpulkan maksimal 3 skill yang sering diminta di bidang target namun belum ada di CV
  const missingTargetSkills = useMemo(() => {
    if (!hasCv || cvSkills.length === 0) return [];
    const cvLower = new Set(cvSkills.map((s) => s.toLowerCase().trim()));
    const skillCountMap = new Map<string, number>();

    const targetJobs = sortedRecommendedJobs.length > 0 ? sortedRecommendedJobs : jobs;
    targetJobs.forEach((job) => {
      job.missingSkills?.forEach((s) => {
        const key = s.trim();
        if (key && !cvLower.has(key.toLowerCase())) {
          skillCountMap.set(key, (skillCountMap.get(key) || 0) + 1);
        }
      });
    });

    if (skillCountMap.size === 0) {
      recommendations.forEach((rec) => {
        const key = rec.skillName?.trim();
        if (key && !cvLower.has(key.toLowerCase())) {
          skillCountMap.set(key, Math.round((rec.demandPercentage * targetJobs.length) / 100) || 1);
        }
      });
    }

    return Array.from(skillCountMap.entries())
      .map(([name, count]) => ({
        skillName: name,
        frequency: count,
        percentage: targetJobs.length > 0 ? Math.round((count / targetJobs.length) * 100) : 0,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
  }, [hasCv, cvSkills, sortedRecommendedJobs, jobs, recommendations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* Page Banner (Sky-Blue Light Gradient, No Eyebrows)                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="page-banner rounded-3xl p-6 sm:p-8 text-sb-navy relative overflow-hidden border border-sb-border shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy flex flex-wrap items-center gap-3">
              <span>Halo, {user?.fullName || "Kawan SkillBridge"}</span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-sb-mist-soft text-sb-navy border border-sb-border">
                {user?.targetRole || "Semua Bidang"}
              </span>
            </h1>
            <p className="text-sb-text-2 text-sm leading-relaxed">
              Ringkasan CV, lowongan, dan lamaranmu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/cv">
              <Button variant="secondary" size="sm" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
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
          {/* BENTO CARD 1: Skill di CV-mu (Col 1-7)                          */}
          {/* =============================================================== */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card flex flex-col justify-between space-y-4 border border-sb-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-sb-navy">
                  Skill di CV&#8209;mu
                </h2>
                <span className="text-xs font-semibold text-sb-text-2">
                  Target: {user?.targetRole || "Semua Bidang"}
                </span>
              </div>

              {hasCv && cvSkills.length > 0 ? (
                <>
                  <div className="space-y-1.5">
                    <p className="text-xs text-sb-text-2 leading-relaxed">
                      CV&#8209;mu mencakup {cvSkills.length} skill yang terdeteksi dan dibandingkan dengan kebutuhan lowongan.
                    </p>
                  </div>

                  {/* Detected skills pill list */}
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {cvSkills.slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold"
                        >
                          <Check className="w-3 h-3 text-sb-good" />
                          {s}
                        </span>
                      ))}
                      {cvSkills.length > 10 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-mist-faint text-sb-text-2 text-xs font-medium border border-sb-border font-mono-metric">
                          +{cvSkills.length - 10} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-white/40 border border-dashed border-sb-border text-xs text-sb-text-2">
                  Belum ada CV. Unggah untuk melihat skill yang terbaca.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-sb-border">
              <Link href="/cv">
                <Button variant="primary" size="sm" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
                  {hasCv ? "Koreksi CV" : "Unggah CV"}
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
          {/* BENTO CARD 2: Lowongan Aktif & Tren Skill (Col 8-12)             */}
          {/* =============================================================== */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card flex flex-col justify-between space-y-4 border border-sb-border">
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-extrabold text-sb-navy tracking-tight font-mono-metric">
                  {totalJobsCount}
                </p>
                <p className="text-xs text-sb-text-2 font-medium mt-0.5">
                  lowongan aktif untuk {user?.targetRole || "Semua Bidang"}
                </p>
              </div>

              {/* Top market skills ranking */}
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-bold text-sb-text-2">
                  Skill paling dicari
                </p>
                {topMarketSkills.length > 0 ? (
                  <div className="space-y-2.5 text-xs">
                    {topMarketSkills.map((item, idx) => (
                      <div key={item.skillName} className="space-y-1">
                        <div className="flex items-center justify-between text-sb-navy font-semibold">
                          <span>#{idx + 1} {item.skillName}</span>
                          <span className="text-sb-blue font-bold font-mono-metric">{formatPercent(item.percentage)}% lowongan</span>
                        </div>
                        <div className="w-full bg-sb-mist-soft rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sb-sky h-full rounded-full transition-all"
                            style={{ width: `${formatPercent(item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-xs text-sb-text-2 italic">
                    Memuat data skill pasar...
                  </div>
                )}
              </div>
            </div>

            <Link href="/insights" className="block pt-2 border-t border-sb-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                rightIcon={<TrendingUp className="w-3.5 h-3.5 text-sb-blue" />}
              >
                <span>Lihat Tren Skill Lengkap</span>
              </Button>
            </Link>
          </div>

          {/* =============================================================== */}
          {/* BENTO CARD 3: Ringkasan 7 Tahapan Lamaran (Col 1-12)             */}
          {/* =============================================================== */}
          <div className="lg:col-span-12 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card space-y-4 border border-sb-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-sb-navy">
                  Status Lamaran ({trackedJobs.length} posisi tersimpan)
                </h3>
              </div>
              <Link href="/tracker">
                <span className="text-xs font-semibold text-sb-blue hover:text-sb-navy flex items-center gap-1">
                  Buka Tracker <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            {/* 7 Stage Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {(
                [
                  { key: "bookmarked", label: "Tersimpan", count: stageStats.bookmarked, color: "text-sb-navy" },
                  { key: "applying", label: "Siapkan Berkas", count: stageStats.applying, color: "text-sb-blue" },
                  { key: "applied", label: "Sudah Melamar", count: stageStats.applied, color: "text-sb-blue" },
                  { key: "interviewing", label: "Wawancara", count: stageStats.interviewing, color: "text-amber-600" },
                  { key: "offered", label: "Penawaran", count: stageStats.offered, color: "text-emerald-600" },
                  { key: "accepted", label: "Diterima", count: stageStats.accepted, color: "text-sb-good" },
                  { key: "rejected", label: "Ditolak", count: stageStats.rejected, color: "text-sb-critical" },
                ] as const
              ).map((stage) => (
                <Link
                  key={stage.key}
                  href={`/tracker?stage=${stage.key}`}
                  className="p-3.5 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue hover:shadow-2xs transition-all flex flex-col justify-between"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-sb-text-2 truncate">
                    {stage.label}
                  </p>
                  <p className={cn("text-xl sm:text-2xl font-extrabold tracking-tight mt-1 font-mono-metric", stage.color)}>
                    {stage.count}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* =============================================================== */}
          {/* BENTO CARD 4: Lowongan Relevan Terpilih                         */}
          {/* =============================================================== */}
          <div className={cn("glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card space-y-4 border border-sb-border", hasCv ? "lg:col-span-8" : "lg:col-span-12")}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-sb-navy">
                  Rekomendasi Lowongan
                </h3>
              </div>
              <Link href="/jobs" className="text-xs font-semibold text-sb-blue hover:underline">
                Lihat Semua ({sortedRecommendedJobs.length})
              </Link>
            </div>

            {sortedRecommendedJobs.length === 0 ? (
              <div className="py-10 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border space-y-2 bg-white/40">
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
                    className="p-4 rounded-xl border border-sb-border bg-white/70 hover:bg-white hover:border-sb-blue transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-sb-navy truncate max-w-[240px] sm:max-w-[320px]">
                          {job.title}
                        </h4>
                        <MatchBadge status={job.matchStatus} score={job.matchScore} />
                      </div>
                      <p className="text-[11px] text-sb-text-2 font-medium">
                        {job.company} • {job.location}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {job.matchedSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold"
                          >
                            <Check className="w-2.5 h-2.5 text-sb-good" />
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
          {/* BENTO CARD 5: Skill yang Belum Ada di CV (Hanya tampil jika ada CV) */}
          {/* =============================================================== */}
          {hasCv && (
            <div className="lg:col-span-4 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card space-y-4 flex flex-col justify-between border border-sb-border">
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-sb-navy">
                    Skill yang belum ada di CV&#8209;mu
                  </h3>
                </div>

                {missingTargetSkills.length === 0 ? (
                  <div className="py-8 text-center text-xs text-sb-text-2 border border-dashed rounded-2xl border-sb-border bg-white/40">
                    Skill di CV&#8209;mu sudah mencakup sebagian besar kebutuhan lowongan di bidang ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {missingTargetSkills.map((rec) => (
                      <div
                        key={rec.skillName}
                        className="p-3.5 rounded-xl border border-sb-border bg-white/70 space-y-1 hover:border-sb-blue/40 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-sb-navy">{rec.skillName}</span>
                          <span className="text-sb-blue font-mono-metric">{formatPercent(rec.percentage)}% lowongan</span>
                        </div>
                        <p className="text-xs text-sb-text-2">
                          Diminta di {rec.frequency} lowongan aktif
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* High Priority Tracked Jobs */}
                {highPriorityTracked.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-sb-border">
                    <p className="text-xs font-bold uppercase tracking-wider text-sb-text-2">
                      Target Prioritas:
                    </p>
                    <div className="space-y-1.5 text-xs">
                      {highPriorityTracked.map((j) => (
                        <Link
                          key={j.id}
                          href="/tracker"
                          className="p-2.5 rounded-xl bg-white/70 border border-sb-border hover:border-sb-blue/40 hover:bg-white transition-all flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-sb-navy truncate text-xs">{j.title}</p>
                            <p className="text-xs text-sb-text-2 truncate">{j.company}</p>
                          </div>
                          <div className="flex items-center gap-0.5 text-sb-warning shrink-0">
                            <Star className="w-3 h-3 fill-sb-warning text-sb-warning" />
                            <span className="text-xs font-bold text-sb-navy font-mono-metric">{j.priority}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-sb-border space-y-2">
                <Link href="/progress" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-xs"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    <span>Lihat Rencana Belajar</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
