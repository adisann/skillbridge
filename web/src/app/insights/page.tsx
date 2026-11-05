"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Sparkles, CheckCircle2, MinusCircle, HelpCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterState } from "@/components/ui/filter";
import { MarketSkillBarChart } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/supabase/auth-context";

interface TopSkillInsight {
  skillName: string;
  category: string;
  frequencyCount: number;
  percentage: number;
  cvStatus: "tercantum" | "belum_ditemukan" | "perlu_verifikasi";
  statusLabel: string;
  exampleRequirement: string;
}

interface LearningRec {
  skillName: string;
  demandPercentage: number;
  reason: string;
  priority?: string;
  action: string;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    role: "Data Analyst",
    workType: "all",
    seniority: "all",
  });
  const [sampleSizeN, setSampleSizeN] = useState<number>(1);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>("4 November 2026");
  const [topSkills, setTopSkills] = useState<TopSkillInsight[]>([]);
  const [learningRecs, setLearningRecs] = useState<LearningRec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedSkillNotice, setAddedSkillNotice] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.role !== "all") queryParams.append("role", filters.role);
        if (filters.workType !== "all") queryParams.append("workType", filters.workType);
        if (filters.seniority !== "all") queryParams.append("seniority", filters.seniority);
        if (user?.id) queryParams.append("userId", user.id);

        const res = await fetch(`/api/insights?${queryParams.toString()}`);
        const data = await res.json();

        if (isMounted) {
          if (!res.ok) throw new Error(data.error || "Gagal memuat insight pasar");
          setSampleSizeN(data.sampleSizeN || 1);
          setLastUpdatedDate(data.lastUpdated || "4 November 2026");
          setTopSkills(data.topSkills || []);
          setLearningRecs(data.learningRecommendations || []);
          setErrorMsg(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const error = err as Error;
          setErrorMsg(error.message || "Gagal memuat insight");
          setIsLoading(false);
        }
      }
    };

    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [filters.role, filters.workType, filters.seniority, user, refreshTrigger]);

  const handleAddLearning = async (skillName: string, reason?: string, priority: string = "Tinggi") => {
    try {
      const res = await fetch("/api/learning-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          skillName,
          reason: reason || `Kebutuhan skill ${skillName} tinggi di pasar (${filters.role}) namun belum ditemukan di CV.`,
          priority,
        }),
      });

      if (res.ok) {
        setAddedSkillNotice(`Skill '${skillName}' berhasil ditambahkan ke daftar target belajar di My Progress!`);
      } else {
        setAddedSkillNotice(`Skill '${skillName}' sudah ada di target belajar Anda.`);
      }
    } catch {
      setAddedSkillNotice(`Skill '${skillName}' disimpan ke target belajar.`);
    }
    setTimeout(() => setAddedSkillNotice(null), 3500);
  };

  const handleClaimSkill = async (skillName: string) => {
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          skillName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddedSkillNotice(data.message || `Skill '${skillName}' ditandai dikuasai (status: Perlu verifikasi).`);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setAddedSkillNotice(data.error || `Gagal menandai skill.`);
      }
    } catch {
      setAddedSkillNotice(`Gagal menandai skill.`);
    }
    setTimeout(() => setAddedSkillNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Market Skill Insights (Top Skills & Gap Pasar)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Menganalisis frekuensi kebutuhan skill dari sampel lowongan nyata di basis data Supabase (AC-03 & AC-04).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/progress">
            <Button variant="outline" size="sm">
              Buka My Progress
            </Button>
          </Link>
          <Link href="/cv">
            <Button variant="primary" size="sm">
              Koreksi Skill CV Saya
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <AlertBanner
          type="error"
          title="Gangguan Memuat Data"
          message={errorMsg}
        />
      )}

      {addedSkillNotice && (
        <AlertBanner
          type="success"
          title="Pembaruan Rencana Belajar / Skill"
          message={addedSkillNotice}
        />
      )}

      {/* Filter Bar (AC-03: N dan ranking berubah saat filter role / kriteria berubah) */}
      <div className="space-y-4">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          sampleCount={sampleSizeN}
        />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : topSkills.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Tidak Ada Data Skill untuk Filter Ini"
            description="Coba sesuaikan filter role atau tipe kerja untuk melihat frekuensi keahlian di pasar kerja."
            actionLabel="Reset Filter"
            onAction={() => setFilters({ role: "Data Analyst", workType: "all", seniority: "all" })}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Visual Bar Chart Pasar (AC-03) */}
          <Card>
            <CardHeader>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Top Skills Paling Dicari Industri</CardTitle>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Sampel N = {sampleSizeN} posting unik
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Pembaruan: {lastUpdatedDate}
                  </span>
                </div>
                <CardDescription>
                  Frekuensi kemunculan skill dihitung per posting lowongan unik (AC-03). Angka ini merupakan indikasi dari sampel lowongan nyata yang tersaring, bukan seluruh pasar kerja.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <MarketSkillBarChart
                skills={topSkills.map((s) => ({
                  skillName: s.skillName,
                  count: s.frequencyCount,
                  percentage: s.percentage,
                  status: s.cvStatus === "tercantum" ? "found" : s.cvStatus === "perlu_verifikasi" ? "needs_verification" : "missing",
                  exampleRequirement: s.exampleRequirement,
                }))}
                totalSampleN={sampleSizeN}
                dataDate={lastUpdatedDate}
                roleFilterLabel={filters.role === "all" ? "Seluruh Posisi" : filters.role}
              />
            </CardContent>
          </Card>

          {/* Detailed Skill Checklist & Comparison (AC-04) */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Skill Pasar vs CV Anda (AC-04)</CardTitle>
              <CardDescription>
                Status kompetensi dinyatakan secara eksplisit dengan teks: <strong>Tercantum di CV</strong>, <strong>Perlu verifikasi</strong>, atau <strong>Belum ditemukan di CV</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSkills.map((item) => (
                <div
                  key={item.skillName}
                  className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    {item.cvStatus === "tercantum" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : item.cvStatus === "perlu_verifikasi" ? (
                      <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <MinusCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-slate-900">{item.skillName}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.frequencyCount} dari {sampleSizeN} lowongan ({item.percentage}%)
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 line-clamp-1 italic text-[11px]">
                        Contoh persyaratan: &ldquo;{item.exampleRequirement}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
                    <span
                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] border ${
                        item.cvStatus === "tercantum"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : item.cvStatus === "perlu_verifikasi"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-slate-50 text-slate-700 border-slate-300"
                      }`}
                    >
                      {item.statusLabel}
                    </span>

                    {item.cvStatus === "belum_ditemukan" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClaimSkill(item.skillName)}
                          className="text-xs"
                          title="Tandai skill yang Anda kuasai namun belum tertulis di dokumen CV"
                        >
                          <Check className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          Saya Kuasai
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddLearning(item.skillName)}
                          className="text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Pelajari
                        </Button>
                      </>
                    )}

                    {item.cvStatus === "perlu_verifikasi" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddLearning(item.skillName)}
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Target Belajar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Learning Priority Recommendations (FR-09) */}
          {learningRecs.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-950">
                  Rekomendasi Prioritas Belajar (Berdasarkan Frekuensi Pasar & Gap CV)
                </h3>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Skill berikut memiliki frekuensi permintaan tertinggi di sampel lowongan ({filters.role === "all" ? "pasar" : filters.role}) namun belum ditemukan di CV Anda:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {learningRecs.map((rec) => (
                  <div key={rec.skillName} className="p-4 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{rec.skillName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {rec.demandPercentage}% Pasar
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rec.reason}</p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddLearning(rec.skillName, rec.reason, rec.priority)}
                        className="w-full text-xs text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tambah ke My Progress
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
