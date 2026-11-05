"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/card";
import { MatchBadge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

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
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  const [topSkillName, setTopSkillName] = useState<string>("SQL");
  const [recommendations, setRecommendations] = useState<Array<{ skillName: string; demandPercentage: number; reason: string; priority: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.append("userId", user.id);

        const [jobsRes, insightsRes] = await Promise.all([
          fetch(`/api/jobs?${queryParams.toString()}`),
          fetch(`/api/insights?${queryParams.toString()}`),
        ]);

        const jobsData = await jobsRes.json();
        const insightsData = await insightsRes.json();

        if (jobsData.jobs) {
          setJobs(jobsData.jobs);
          setTotalJobsCount(jobsData.total || jobsData.jobs.length);
        }

        if (insightsData.topSkills && insightsData.topSkills.length > 0) {
          setTopSkillName(insightsData.topSkills[0].skillName);
        }

        if (insightsData.learningRecommendations) {
          setRecommendations(insightsData.learningRecommendations);
        }
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const bestMatchJob = jobs.length > 0 ? jobs[0] : null;

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Analisis Kesesuaian Kompetensi Aktif
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Selamat Datang, {user?.fullName || "Pengguna"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pusat kendali evaluasi karier Anda. Unggah CV, amati kecocokan dengan {totalJobsCount} lowongan aktif, dan identifikasi kesenjangan skill pasar secara transparan.
            </p>
          </div>
        </div>

        {/* 3 Core Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">1. Upload & Koreksi CV (AC-01)</CardTitle>
              <CardDescription className="text-xs">
                Unggah CV baru atau gunakan contoh demo juri, lalu sesuaikan skill yang diekstrak.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/cv">
                <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Buka Onboarding CV
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <Search className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">2. Cari Lowongan (Job Explorer)</CardTitle>
              <CardDescription className="text-xs">
                Jelajahi {totalJobsCount} lowongan nyata dari Greenhouse, Lever, dan JobStreet Indonesia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/jobs">
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Buka Job Explorer
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">3. Market Skill Insights</CardTitle>
              <CardDescription className="text-xs">
                Amati ranking skill yang paling dicari pasar dan bandingkan dengan CV Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/insights">
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Buka Market Insights
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Lowongan Aktif"
            value={`${totalJobsCount} Posisi`}
            subtitle="Tersinkronisasi langsung dari database"
          />
          <MetricCard
            title="Role Target"
            value={user?.targetRole || "Data Analyst"}
            subtitle="Dasar pencocokan kualifikasi"
          />
          <MetricCard
            title="Skill Teratas Pasar"
            value={topSkillName}
            subtitle="Kualifikasi paling dicari industri"
          />
          <MetricCard
            title="Kecocokan Tertinggi"
            value={bestMatchJob && bestMatchJob.matchScore > 0 ? `${bestMatchJob.matchScore}%` : "Siap Analisis"}
            subtitle={bestMatchJob?.company || "Belum ada CV aktif"}
          />
        </div>

        {/* Section: Lowongan Rekomendasi Teratas */}
        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Rekomendasi Lowongan Paling Relevan</CardTitle>
                  <CardDescription>
                    Peringkat kecocokan berdasarkan kualifikasi skill di CV Anda.
                  </CardDescription>
                </div>
                <Link href="/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
                  Lihat Semua ({jobs.length})
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {jobs.slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{j.title}</span>
                        <MatchBadge status={j.matchStatus} score={j.matchScore} />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {j.company} • {j.location}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {j.matchedSkills.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                            ✓ {s}
                          </span>
                        ))}
                        {j.missingSkills.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                            Belum: {j.missingSkills[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href={`/jobs/${j.id}`}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Detail Match & Bobot <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Card: Rencana Belajar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Rencana Peningkatan Skill
                </CardTitle>
                <CardDescription>
                  Skill pasar yang direkomendasikan untuk Anda pelajari.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 2).map((rec, idx) => (
                    <div
                      key={rec.skillName}
                      className={cn(
                        "p-3 rounded-xl border space-y-1.5",
                        idx === 0 ? "border-blue-100 bg-blue-50/60" : "border-slate-200 bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{rec.skillName}</span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded",
                            idx === 0 ? "bg-blue-200/80 text-blue-900" : "bg-slate-200 text-slate-700"
                          )}
                        >
                          Prioritas {rec.priority}
                        </span>
                      </div>
                      <p className={cn("text-[11px]", idx === 0 ? "text-blue-800" : "text-slate-600")}>
                        {rec.reason}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center py-6">
                    <p className="text-xs text-slate-500">
                      Belum ada rekomendasi gap skill. Unggah atau perbarui CV Anda untuk melihat target peningkatan kompetensi terarah.
                    </p>
                  </div>
                )}

                <Link href="/progress">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600 mt-2">
                    Kelola Rencana Belajar di My Progress <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
